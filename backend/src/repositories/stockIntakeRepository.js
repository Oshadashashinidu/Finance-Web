const { getPool } = require("../config/database");

async function listStockIntakes() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"IntakeId\", \"MaterialId\", \"MaterialName\", \"SupplierId\", \"SupplierName\", " +
      "\"Quantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\", \"CreatedAt\" " +
      "FROM public.stock_intakes ORDER BY \"IntakeDate\" DESC, \"CreatedAt\" DESC"
  );

  return result.rows;
}

module.exports = {
  listStockIntakes
};
