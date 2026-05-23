const { v4: uuidv4 } = require("uuid");
const { getPool } = require("../config/database");
const rawMaterialRepository = require("../repositories/rawMaterialRepository");
const stockIssueRepository = require("../repositories/stockIssueRepository");

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

async function listStockIssues() {
  return stockIssueRepository.listStockIssues();
}

async function createStockIssue(payload) {
  if (!payload.materialId) {
    throw badRequest("materialId is required.");
  }

  const quantity = toNumber(payload.quantity, 0);
  const unitPrice = toNumber(payload.unitPrice, 0);
  if (quantity <= 0 || unitPrice < 0) {
    throw badRequest("quantity and unitPrice must be valid numbers.");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await rawMaterialRepository.getRawMaterialById(payload.materialId, client);
    if (!existing) {
      throw badRequest("Raw material not found.");
    }

    const currentQuantity = Number(existing.CurrentQuantity) || 0;
    if (quantity > currentQuantity) {
      throw badRequest("Issue quantity exceeds available stock.");
    }

    const unit = payload.unit || existing.Unit || "kg";
    const totalCost = quantity * unitPrice;
    const issueDate = payload.issueDate ? new Date(payload.issueDate) : new Date();

    const nextQuantity = currentQuantity - quantity;
    const nextTotalCost = Math.max(0, Number(existing.TotalCost) - totalCost);
    const nextUnitCost = nextQuantity > 0 ? nextTotalCost / nextQuantity : 0;
    const nextStatus = computeStatus(nextQuantity, Number(existing.ReorderLevel));

    await rawMaterialRepository.updateRawMaterialTotals(
      {
        materialId: payload.materialId,
        currentQuantity: nextQuantity,
        unit,
        unitCost: nextUnitCost,
        totalCost: nextTotalCost,
        status: nextStatus
      },
      client
    );

    const issueId = uuidv4();
    await client.query(
      "INSERT INTO public.stock_issues (\"IssueId\", \"MaterialId\", \"MaterialName\", \"Quantity\", \"Unit\", " +
        "\"UnitPrice\", \"TotalCost\", \"IssueDate\") " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        issueId,
        payload.materialId,
        payload.materialName || existing.MaterialName,
        quantity,
        unit,
        unitPrice,
        totalCost,
        issueDate
      ]
    );

    await client.query("COMMIT");

    return {
      IssueId: issueId,
      MaterialId: payload.materialId,
      MaterialName: payload.materialName || existing.MaterialName,
      Quantity: quantity,
      Unit: unit,
      UnitPrice: unitPrice,
      TotalCost: totalCost,
      IssueDate: issueDate.toISOString()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listStockIssues,
  createStockIssue
};
