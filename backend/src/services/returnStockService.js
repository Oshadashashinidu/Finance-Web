const { v4: uuidv4 } = require("uuid");
const { getPool } = require("../config/database");
const rawMaterialRepository = require("../repositories/rawMaterialRepository");
const returnStockRepository = require("../repositories/returnStockRepository");
const { sendReturnStockEmail } = require("./emailService");

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

async function listReturnStocks() {
  return returnStockRepository.listReturnStocks();
}

async function listReturnableBatches(materialId) {
  if (!materialId) {
    throw badRequest("materialId is required.");
  }

  return returnStockRepository.listReturnableBatches(materialId);
}

async function createReturnStock(payload) {
  if (!payload.materialId) {
    throw badRequest("materialId is required.");
  }
  if (!payload.fifoId) {
    throw badRequest("fifoId is required.");
  }
  if (!payload.reason) {
    throw badRequest("reason is required.");
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
      "SELECT f.\"FifoId\", f.\"MaterialId\", f.\"MaterialName\", f.\"RemainingQuantity\", " +
        "f.\"Unit\", f.\"UnitPrice\", f.\"IntakeDate\", " +
        "s.\"SupplierId\", s.\"SupplierName\", s.\"Email\" AS \"SupplierEmail\" " +
        "FROM public.fifo f " +
        "JOIN public.stock_intakes si ON si.\"IntakeId\" = f.\"IntakeId\" " +
        "JOIN public.suppliers s ON s.\"SupplierId\" = si.\"SupplierId\" " +
        "WHERE f.\"FifoId\" = $1 AND f.\"MaterialId\" = $2 FOR UPDATE",
      [payload.fifoId, payload.materialId]
    );

    const fifoRow = fifoResult.rows[0];
    if (!fifoRow) {
      throw badRequest("Selected stock batch not found.");
    }

    const available = Number(fifoRow.RemainingQuantity) || 0;
    if (quantity > available) {
      throw badRequest("Return quantity exceeds batch availability.");
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
    const returnDate = payload.returnDate ? new Date(payload.returnDate) : new Date();

    const record = {
      ReturnId: uuidv4(),
      MaterialId: payload.materialId,
      MaterialName: payload.materialName || fifoRow.MaterialName,
      SupplierId: fifoRow.SupplierId,
      SupplierName: fifoRow.SupplierName,
      SupplierEmail: fifoRow.SupplierEmail || "",
      FifoId: fifoRow.FifoId,
      Quantity: quantity,
      Unit: payload.unit || fifoRow.Unit || existing.Unit || "kg",
      UnitPrice: Number(fifoRow.UnitPrice) || 0,
      TotalCost: totalCost,
      IntakeDate: fifoRow.IntakeDate,
      ReturnDate: returnDate,
      Reason: payload.reason
    };

    const saved = await returnStockRepository.createReturnStock(record, client);

    const updatedTotals = await getFifoTotals(payload.materialId, client);
    const nextUnitCost = updatedTotals.totalQuantity > 0
      ? updatedTotals.totalCost / updatedTotals.totalQuantity
      : 0;
    const nextStatus = computeStatus(updatedTotals.totalQuantity, Number(existing.ReorderLevel));

    await rawMaterialRepository.updateRawMaterialTotals(
      {
        materialId: payload.materialId,
        currentQuantity: updatedTotals.totalQuantity,
        unit: record.Unit,
        unitCost: nextUnitCost,
        totalCost: updatedTotals.totalCost,
        status: nextStatus
      },
      client
    );

    await client.query("COMMIT");

    if (record.SupplierEmail) {
      await sendReturnStockEmail(record);
    }

    return {
      ReturnId: saved.ReturnId,
      MaterialId: saved.MaterialId,
      MaterialName: saved.MaterialName,
      SupplierId: saved.SupplierId,
      SupplierName: saved.SupplierName,
      SupplierEmail: saved.SupplierEmail,
      FifoId: saved.FifoId,
      Quantity: saved.Quantity,
      Unit: saved.Unit,
      UnitPrice: saved.UnitPrice,
      TotalCost: saved.TotalCost,
      IntakeDate: saved.IntakeDate ? new Date(saved.IntakeDate).toISOString() : null,
      ReturnDate: saved.ReturnDate ? new Date(saved.ReturnDate).toISOString() : null,
      Reason: saved.Reason
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listReturnStocks,
  listReturnableBatches,
  createReturnStock
};
