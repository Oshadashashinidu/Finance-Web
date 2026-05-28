const { getPool } = require("../config/database");

async function listWasteStocks() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT wasteid AS \"WasteId\", materialid AS \"MaterialId\", materialname AS \"MaterialName\", " +
      "fifoid AS \"FifoId\", quantity AS \"Quantity\", unit AS \"Unit\", " +
      "unitprice AS \"UnitPrice\", totalcost AS \"TotalCost\", intakedate AS \"IntakeDate\", " +
      "wastedate AS \"WasteDate\", createdat AS \"CreatedAt\" " +
      "FROM public.waste_stocks ORDER BY wastedate DESC, createdat DESC"
  );

  return result.rows;
}

async function createWasteStock(payload, client) {
  const result = await client.query(
    "INSERT INTO public.waste_stocks (wasteid, materialid, materialname, fifoid, " +
      "quantity, unit, unitprice, totalcost, intakedate, wastedate) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    [
      payload.WasteId,
      payload.MaterialId,
      payload.MaterialName,
      payload.FifoId,
      payload.Quantity,
      payload.Unit,
      payload.UnitPrice,
      payload.TotalCost,
      payload.IntakeDate,
      payload.WasteDate
    ]
  );

  return result.rowCount > 0;
}

module.exports = {
  listWasteStocks,
  createWasteStock
};
