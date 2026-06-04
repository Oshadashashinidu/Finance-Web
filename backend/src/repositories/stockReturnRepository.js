const { getPool } = require("../config/database");

async function createStockReturn(ret) {
  const pool = getPool();
  const result = await pool.query(
    "INSERT INTO public.stock_returns (return_id, material_id, material_name, intake_id, fifo_id, supplier_id, supplier_name, quantity, unit, unit_price, total_cost, reason, return_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING return_id AS \"ReturnId\", material_id AS \"MaterialId\", material_name AS \"MaterialName\", intake_id AS \"IntakeId\", fifo_id AS \"FifoId\", supplier_id AS \"SupplierId\", supplier_name AS \"SupplierName\", quantity AS \"Quantity\", unit AS \"Unit\", unit_price AS \"UnitPrice\", total_cost AS \"TotalCost\", reason AS \"Reason\", return_date AS \"ReturnDate\"",
    [
      ret.ReturnId,
      ret.MaterialId,
      ret.MaterialName,
      ret.IntakeId || null,
      ret.FifoId || null,
      ret.SupplierId || null,
      ret.SupplierName || null,
      ret.Quantity,
      ret.Unit,
      ret.UnitPrice,
      ret.TotalCost,
      ret.Reason || "",
      ret.ReturnDate || new Date()
    ]
  );

  return result.rows[0];
}

async function listStockReturns(limit = 50) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT return_id AS \"ReturnId\", material_id AS \"MaterialId\", material_name AS \"MaterialName\", intake_id AS \"IntakeId\", fifo_id AS \"FifoId\", supplier_id AS \"SupplierId\", supplier_name AS \"SupplierName\", quantity AS \"Quantity\", unit AS \"Unit\", unit_price AS \"UnitPrice\", total_cost AS \"TotalCost\", reason AS \"Reason\", return_date AS \"ReturnDate\" FROM public.stock_returns ORDER BY return_date DESC LIMIT $1",
    [limit]
  );

  return result.rows;
}

async function getAvailableBatchesByMaterial(materialId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT f.\"FifoId\" AS \"FifoId\", f.\"IntakeId\" AS \"IntakeId\", f.\"RemainingQuantity\" AS \"RemainingQuantity\", f.\"UnitPrice\" AS \"UnitPrice\", f.\"IntakeDate\" AS \"IntakeDate\", s.\"SupplierId\" AS \"SupplierId\", s.\"SupplierName\" AS \"SupplierName\" FROM public.fifo f LEFT JOIN public.stock_intakes s ON s.\"IntakeId\" = f.\"IntakeId\" WHERE f.\"MaterialId\" = $1 AND f.\"RemainingQuantity\" > 0 ORDER BY f.\"IntakeDate\" ASC",
    [materialId]
  );

  return result.rows;
}

module.exports = {
  createStockReturn,
  listStockReturns,
  getAvailableBatchesByMaterial
};
