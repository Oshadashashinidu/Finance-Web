const { getPool } = require("../config/database");

async function getChangeByDate(changeDate) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT change_date AS \"ChangeDate\", total_raw_materials_delta AS \"TotalRawMaterialsDelta\", " +
      "low_stock_delta AS \"LowStockDelta\", pending_purchase_delta AS \"PendingPurchaseDelta\", " +
      "out_of_stock_delta AS \"OutOfStockDelta\", stock_in_delta AS \"StockInDelta\", " +
      "stock_out_delta AS \"StockOutDelta\", waste_delta AS \"WasteDelta\", return_delta AS \"ReturnDelta\", " +
      "created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\" " +
      "FROM public.inventory_daily_changes WHERE change_date = $1",
    [changeDate]
  );

  return result.rows[0] || null;
}

async function upsertChange(change) {
  const pool = getPool();
  const result = await pool.query(
    "INSERT INTO public.inventory_daily_changes (change_date, total_raw_materials_delta, " +
      "low_stock_delta, pending_purchase_delta, out_of_stock_delta, stock_in_delta, " +
      "stock_out_delta, waste_delta, return_delta) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) " +
      "ON CONFLICT (change_date) DO UPDATE SET " +
      "total_raw_materials_delta = EXCLUDED.total_raw_materials_delta, " +
      "low_stock_delta = EXCLUDED.low_stock_delta, " +
      "pending_purchase_delta = EXCLUDED.pending_purchase_delta, " +
      "out_of_stock_delta = EXCLUDED.out_of_stock_delta, " +
      "stock_in_delta = EXCLUDED.stock_in_delta, " +
      "stock_out_delta = EXCLUDED.stock_out_delta, " +
      "waste_delta = EXCLUDED.waste_delta, " +
      "return_delta = EXCLUDED.return_delta, " +
      "updated_at = now() " +
      "RETURNING change_date AS \"ChangeDate\", total_raw_materials_delta AS \"TotalRawMaterialsDelta\", " +
      "low_stock_delta AS \"LowStockDelta\", pending_purchase_delta AS \"PendingPurchaseDelta\", " +
      "out_of_stock_delta AS \"OutOfStockDelta\", stock_in_delta AS \"StockInDelta\", " +
      "stock_out_delta AS \"StockOutDelta\", waste_delta AS \"WasteDelta\", return_delta AS \"ReturnDelta\", " +
      "created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\"",
    [
      change.ChangeDate,
      change.TotalRawMaterialsDelta,
      change.LowStockDelta,
      change.PendingPurchaseDelta,
      change.OutOfStockDelta,
      change.StockInDelta,
      change.StockOutDelta,
      change.WasteDelta,
      change.ReturnDelta
    ]
  );

  return result.rows[0];
}

module.exports = {
  getChangeByDate,
  upsertChange
};
