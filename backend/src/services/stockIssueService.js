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

async function getFifoRows(materialId, client) {
  const result = await client.query(
    "SELECT \"FifoId\", \"RemainingQuantity\", \"UnitPrice\" " +
      "FROM public.fifo WHERE \"MaterialId\" = $1 " +
      "ORDER BY \"IntakeDate\" ASC, \"CreatedAt\" ASC, \"FifoId\" ASC FOR UPDATE",
    [materialId]
  );

  return result.rows;
}

async function listStockIssues() {
  return stockIssueRepository.listStockIssues();
}

async function createStockIssue(payload) {
  if (!payload.materialId) {
    throw badRequest("materialId is required.");
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

    const fifoTotals = await getFifoTotals(payload.materialId, client);
    if (quantity > fifoTotals.totalQuantity) {
      throw badRequest("Issue quantity exceeds available stock.");
    }

    const unit = payload.unit || existing.Unit || "kg";
    const issueDate = payload.issueDate ? new Date(payload.issueDate) : new Date();

    const fifoRows = await getFifoRows(payload.materialId, client);
    let remainingToIssue = quantity;
    let totalCost = 0;

    for (const row of fifoRows) {
      if (remainingToIssue <= 0) {
        break;
      }

      const available = Number(row.RemainingQuantity) || 0;
      if (available <= 0) {
        continue;
      }

      const used = Math.min(available, remainingToIssue);
      const nextRemaining = available - used;
      totalCost += used * (Number(row.UnitPrice) || 0);
      remainingToIssue -= used;

      if (nextRemaining <= 0) {
        await client.query(
          "UPDATE public.fifo SET \"RemainingQuantity\" = 0 WHERE \"FifoId\" = $1",
          [row.FifoId]
        );
      } else {
        await client.query(
          "UPDATE public.fifo SET \"RemainingQuantity\" = $2 WHERE \"FifoId\" = $1",
          [row.FifoId, nextRemaining]
        );
      }
    }

    if (remainingToIssue > 0) {
      throw badRequest("Issue quantity exceeds available stock.");
    }

    const updatedTotals = await getFifoTotals(payload.materialId, client);
    const nextUnitCost = updatedTotals.totalQuantity > 0
      ? updatedTotals.totalCost / updatedTotals.totalQuantity
      : 0;
    const nextStatus = computeStatus(updatedTotals.totalQuantity, Number(existing.ReorderLevel));

    await rawMaterialRepository.updateRawMaterialTotals(
      {
        materialId: payload.materialId,
        currentQuantity: updatedTotals.totalQuantity,
        unit,
        unitCost: nextUnitCost,
        totalCost: updatedTotals.totalCost,
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
        0,
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
      UnitPrice: 0,
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
