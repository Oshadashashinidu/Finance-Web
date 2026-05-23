const { getPool } = require("../config/database");

async function listStockIssues() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"IssueId\", \"MaterialId\", \"MaterialName\", \"Quantity\", \"Unit\", \"UnitPrice\", " +
      "\"TotalCost\", \"IssueDate\", \"CreatedAt\" " +
      "FROM public.stock_issues ORDER BY \"IssueDate\" DESC, \"CreatedAt\" DESC"
  );

  return result.rows;
}

module.exports = {
  listStockIssues
};
