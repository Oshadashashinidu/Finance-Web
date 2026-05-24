const { getPool } = require("../config/database");

async function listFifoByMaterialId(materialId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"FifoId\", \"IntakeId\", \"MaterialId\", \"MaterialName\", " +
      "\"Quantity\", \"RemainingQuantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", " +
      "\"IntakeDate\", \"CreatedAt\" " +
      "FROM public.fifo WHERE \"MaterialId\" = $1 " +
      "ORDER BY \"IntakeDate\" ASC, \"CreatedAt\" ASC, \"FifoId\" ASC",
    [materialId]
  );

  return result.rows;
}

module.exports = {
  listFifoByMaterialId
};
