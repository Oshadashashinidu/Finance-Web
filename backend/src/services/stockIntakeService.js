const { v4: uuidv4 } = require("uuid");
const { getPool } = require("../config/database");
const rawMaterialRepository = require("../repositories/rawMaterialRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

function computeStatus(currentQuantity, reorderLevel) {
  if (currentQuantity > reorderLevel) {
    return "OK";
  }
  if (currentQuantity === reorderLevel) {
    return "Equal";
  }
  return "Low";
}

async function getFifoTotals(materialId, client) {
  const result = await client.query(
    "SELECT COALESCE(SUM(\"RemainingQuantity\"), 0) AS total_quantity, " +
      "COALESCE(SUM(\"RemainingQuantity\" * \"UnitPrice\"), 0) AS total_cost " +
      "FROM public.fifo WHERE \"MaterialId\" = $1",
    [materialId]
  );

  const row = result.rows[0] || {};
  return {
    totalQuantity: Number(row.total_quantity) || 0,
    totalCost: Number(row.total_cost) || 0
  };
}

async function listStockIntakes() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"IntakeId\", \"MaterialId\", \"MaterialName\", \"SupplierId\", \"SupplierName\", " +
      "\"Quantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\", \"CreatedAt\" " +
      "FROM public.stock_intakes ORDER BY \"IntakeDate\" DESC, \"CreatedAt\" DESC"
  );
  return result.rows;
}

async function createStockIntake(payload) {
  if (!payload.materialId) {
    throw badRequest("materialId is required.");
  }
  if (!payload.materialName) {
    throw badRequest("materialName is required.");
  }
  if (!payload.supplierId || !payload.supplierName) {
    throw badRequest("supplierId and supplierName are required.");
  }

  const quantity = toNumber(payload.quantity, 0);
  const unitPrice = toNumber(payload.unitPrice, 0);
  if (quantity <= 0 || unitPrice < 0) {
    throw badRequest("quantity and unitPrice must be valid numbers.");
  }

  const unit = payload.unit || "kg";
  const totalCost = quantity * unitPrice;
  const intakeDate = payload.intakeDate ? new Date(payload.intakeDate) : new Date();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await rawMaterialRepository.getRawMaterialById(payload.materialId, client);
    if (!existing) {
      throw badRequest("Raw material not found.");
    }

    const intakeId = uuidv4();
    await client.query(
      "INSERT INTO public.stock_intakes (\"IntakeId\", \"MaterialId\", \"MaterialName\", \"SupplierId\", " +
        "\"SupplierName\", \"Quantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\") " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        intakeId,
        payload.materialId,
        payload.materialName,
        payload.supplierId,
        payload.supplierName,
        quantity,
        unit,
        unitPrice,
        totalCost,
        intakeDate
      ]
    );

    const fifoId = uuidv4();
    await client.query(
      "INSERT INTO public.fifo (\"FifoId\", \"IntakeId\", \"MaterialId\", \"MaterialName\", \"Quantity\", " +
        "\"RemainingQuantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\") " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [
        fifoId,
        intakeId,
        payload.materialId,
        payload.materialName,
        quantity,
        quantity,
        unit,
        unitPrice,
        totalCost,
        intakeDate
      ]
    );

    const totals = await getFifoTotals(payload.materialId, client);
    const nextUnitCost = totals.totalQuantity > 0 ? totals.totalCost / totals.totalQuantity : 0;
    const nextStatus = computeStatus(totals.totalQuantity, Number(existing.ReorderLevel));

    await rawMaterialRepository.updateRawMaterialTotals(
      {
        materialId: payload.materialId,
        currentQuantity: totals.totalQuantity,
        unit,
        unitCost: nextUnitCost,
        totalCost: totals.totalCost,
        status: nextStatus
      },
      client
    );

    await client.query("COMMIT");

    return {
      IntakeId: intakeId,
      MaterialId: payload.materialId,
      MaterialName: payload.materialName,
      SupplierId: payload.supplierId,
      SupplierName: payload.supplierName,
      Quantity: quantity,
      Unit: unit,
      UnitPrice: unitPrice,
      TotalCost: totalCost,
      IntakeDate: intakeDate.toISOString()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listStockIntakes,
  createStockIntake
};
