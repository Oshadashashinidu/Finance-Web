const { getPool } = require("../config/database");

async function listWasteStocks() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"WasteId\" AS \"WasteId\", \"MaterialId\" AS \"MaterialId\", \"MaterialName\" AS \"MaterialName\", " +
      "\"FifoId\" AS \"FifoId\", \"Quantity\" AS \"Quantity\", \"Unit\" AS \"Unit\", " +
      "\"UnitPrice\" AS \"UnitPrice\", \"TotalCost\" AS \"TotalCost\", \"IntakeDate\" AS \"IntakeDate\", " +
      "\"WasteDate\" AS \"WasteDate\", \"CreatedAt\" AS \"CreatedAt\" " +
      "FROM public.waste_stocks ORDER BY \"WasteDate\" DESC, \"CreatedAt\" DESC"
  );

  return result.rows;
}

async function createWasteStock(payload, client) {
  const result = await client.query(
    "INSERT INTO public.waste_stocks (\"WasteId\", \"MaterialId\", \"MaterialName\", \"FifoId\", " +
      "\"Quantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\", \"WasteDate\") " +
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
