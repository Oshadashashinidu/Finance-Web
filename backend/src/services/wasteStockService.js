const { v4: uuidv4 } = require("uuid");
const { getPool } = require("../config/database");
const rawMaterialRepository = require("../repositories/rawMaterialRepository");
const wasteStockRepository = require("../repositories/wasteStockRepository");

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

async function listWasteStocks() {
  return wasteStockRepository.listWasteStocks();
}

async function createWasteStock(payload) {
  if (!payload.materialId) {
    throw badRequest("materialId is required.");
  }
  if (!payload.fifoId) {
    throw badRequest("fifoId is required.");
  }

  const quantity = toNumber(payload.quantity, 0);
  if (quantity <= 0) {
    throw badRequest("quantity must be a valid number.");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await rawMaterialRepository.getRawMaterialById(payload.materialId, client);
    if (!existing) {
      throw badRequest("Raw material not found.");
    }

    const fifoResult = await client.query(
      "SELECT \"FifoId\", \"MaterialId\", \"MaterialName\", \"RemainingQuantity\", \"Unit\", " +
        "\"UnitPrice\", \"IntakeDate\" " +
        "FROM public.fifo WHERE \"FifoId\" = $1 AND \"MaterialId\" = $2 FOR UPDATE",
      [payload.fifoId, payload.materialId]
    );

    const fifoRow = fifoResult.rows[0];
    if (!fifoRow) {
      throw badRequest("Selected stock batch not found.");
    }

    const available = Number(fifoRow.RemainingQuantity) || 0;
    if (quantity > available) {
      throw badRequest("Waste quantity exceeds batch availability.");
    }

    const nextRemaining = available - quantity;
    if (nextRemaining <= 0) {
      await client.query(
        "UPDATE public.fifo SET \"RemainingQuantity\" = 0 WHERE \"FifoId\" = $1",
        [fifoRow.FifoId]
      );
    } else {
      await client.query(
        "UPDATE public.fifo SET \"RemainingQuantity\" = $2 WHERE \"FifoId\" = $1",
        [fifoRow.FifoId, nextRemaining]
      );
    }

    const totalCost = quantity * (Number(fifoRow.UnitPrice) || 0);
    const wasteDate = payload.wasteDate ? new Date(payload.wasteDate) : new Date();

    const wasteRecord = {
      WasteId: uuidv4(),
      MaterialId: payload.materialId,
      MaterialName: payload.materialName || fifoRow.MaterialName,
      FifoId: fifoRow.FifoId,
      Quantity: quantity,
      Unit: payload.unit || fifoRow.Unit || existing.Unit || "kg",
      UnitPrice: Number(fifoRow.UnitPrice) || 0,
      TotalCost: totalCost,
      IntakeDate: fifoRow.IntakeDate,
      WasteDate: wasteDate
    };

    await wasteStockRepository.createWasteStock(wasteRecord, client);

    const updatedTotals = await getFifoTotals(payload.materialId, client);
    const nextUnitCost = updatedTotals.totalQuantity > 0
      ? updatedTotals.totalCost / updatedTotals.totalQuantity
      : 0;
    const nextStatus = computeStatus(updatedTotals.totalQuantity, Number(existing.ReorderLevel));

    await rawMaterialRepository.updateRawMaterialTotals(
      {
        materialId: payload.materialId,
        currentQuantity: updatedTotals.totalQuantity,
        unit: wasteRecord.Unit,
        unitCost: nextUnitCost,
        totalCost: updatedTotals.totalCost,
        status: nextStatus
      },
      client
    );

    await client.query("COMMIT");

    return {
      WasteId: wasteRecord.WasteId,
      MaterialId: wasteRecord.MaterialId,
      MaterialName: wasteRecord.MaterialName,
      FifoId: wasteRecord.FifoId,
      Quantity: wasteRecord.Quantity,
      Unit: wasteRecord.Unit,
      UnitPrice: wasteRecord.UnitPrice,
      TotalCost: wasteRecord.TotalCost,
      IntakeDate: wasteRecord.IntakeDate ? new Date(wasteRecord.IntakeDate).toISOString() : null,
      WasteDate: wasteDate.toISOString()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listWasteStocks,
  createWasteStock
};
