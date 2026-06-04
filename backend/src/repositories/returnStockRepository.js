const { getPool } = require("../config/database");

async function listReturnStocks() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"ReturnId\" AS \"ReturnId\", \"MaterialId\" AS \"MaterialId\", \"MaterialName\" AS \"MaterialName\", " +
      "\"SupplierId\" AS \"SupplierId\", \"SupplierName\" AS \"SupplierName\", \"SupplierEmail\" AS \"SupplierEmail\", " +
      "\"FifoId\" AS \"FifoId\", \"Quantity\" AS \"Quantity\", \"Unit\" AS \"Unit\", \"UnitPrice\" AS \"UnitPrice\", " +
      "\"TotalCost\" AS \"TotalCost\", \"IntakeDate\" AS \"IntakeDate\", \"ReturnDate\" AS \"ReturnDate\", " +
      "\"Reason\" AS \"Reason\", \"CreatedAt\" AS \"CreatedAt\" " +
      "FROM public.return_stocks ORDER BY \"ReturnDate\" DESC, \"CreatedAt\" DESC"
  );

  return result.rows;
}

async function createReturnStock(record, client) {
  const runner = client || getPool();
  const result = await runner.query(
    "INSERT INTO public.return_stocks (\"ReturnId\", \"MaterialId\", \"MaterialName\", \"SupplierId\", \"SupplierName\", " +
      "\"SupplierEmail\", \"FifoId\", \"Quantity\", \"Unit\", \"UnitPrice\", \"TotalCost\", \"IntakeDate\", \"ReturnDate\", \"Reason\") " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) " +
      "RETURNING \"ReturnId\" AS \"ReturnId\", \"MaterialId\" AS \"MaterialId\", \"MaterialName\" AS \"MaterialName\", " +
      "\"SupplierId\" AS \"SupplierId\", \"SupplierName\" AS \"SupplierName\", \"SupplierEmail\" AS \"SupplierEmail\", " +
      "\"FifoId\" AS \"FifoId\", \"Quantity\" AS \"Quantity\", \"Unit\" AS \"Unit\", \"UnitPrice\" AS \"UnitPrice\", " +
      "\"TotalCost\" AS \"TotalCost\", \"IntakeDate\" AS \"IntakeDate\", \"ReturnDate\" AS \"ReturnDate\", " +
      "\"Reason\" AS \"Reason\", \"CreatedAt\" AS \"CreatedAt\"",
    [
      record.ReturnId,
      record.MaterialId,
      record.MaterialName,
      record.SupplierId,
      record.SupplierName,
      record.SupplierEmail,
      record.FifoId,
      record.Quantity,
      record.Unit,
      record.UnitPrice,
      record.TotalCost,
      record.IntakeDate,
      record.ReturnDate,
      record.Reason
    ]
  );

  return result.rows[0];
}

async function listReturnableBatches(materialId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT f.\"FifoId\", f.\"MaterialId\", f.\"MaterialName\", f.\"RemainingQuantity\", " +
      "f.\"Unit\", f.\"UnitPrice\", f.\"IntakeDate\", " +
      "s.\"SupplierId\", s.\"SupplierName\", s.\"Email\" AS \"SupplierEmail\" " +
      "FROM public.fifo f " +
      "JOIN public.stock_intakes si ON si.\"IntakeId\" = f.\"IntakeId\" " +
      "JOIN public.suppliers s ON s.\"SupplierId\" = si.\"SupplierId\" " +
      "WHERE f.\"MaterialId\" = $1 AND f.\"RemainingQuantity\" > 0 " +
      "ORDER BY f.\"IntakeDate\" ASC, f.\"CreatedAt\" ASC",
    [materialId]
  );

  return result.rows;
}

module.exports = {
  listReturnStocks,
  createReturnStock,
  listReturnableBatches
};
