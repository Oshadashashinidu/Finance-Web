const { getPool } = require("../config/database");

async function getSummaryByDate(summaryDate) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT summary_date AS \"SummaryDate\", total_raw_materials AS \"TotalRawMaterials\", " +
      "low_stock_count AS \"LowStockCount\", equal_stock_count AS \"EqualStockCount\", " +
      "ok_stock_count AS \"OkStockCount\", out_of_stock_count AS \"OutOfStockCount\", " +
      "pending_purchase_count AS \"PendingPurchaseCount\", stock_in_qty AS \"StockInQty\", " +
      "stock_out_qty AS \"StockOutQty\", waste_qty AS \"WasteQty\", " +
      "created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\" " +
      "FROM public.inventory_daily_summaries WHERE summary_date = $1",
    [summaryDate]
  );

  return result.rows[0] || null;
}

async function upsertSummary(summary) {
  const pool = getPool();
  const result = await pool.query(
    "INSERT INTO public.inventory_daily_summaries (summary_date, total_raw_materials, low_stock_count, " +
      "equal_stock_count, ok_stock_count, out_of_stock_count, pending_purchase_count, " +
      "stock_in_qty, stock_out_qty, waste_qty) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) " +
      "ON CONFLICT (summary_date) DO UPDATE SET " +
      "total_raw_materials = EXCLUDED.total_raw_materials, " +
      "low_stock_count = EXCLUDED.low_stock_count, " +
      "equal_stock_count = EXCLUDED.equal_stock_count, " +
      "ok_stock_count = EXCLUDED.ok_stock_count, " +
      "out_of_stock_count = EXCLUDED.out_of_stock_count, " +
      "pending_purchase_count = EXCLUDED.pending_purchase_count, " +
      "stock_in_qty = EXCLUDED.stock_in_qty, " +
      "stock_out_qty = EXCLUDED.stock_out_qty, " +
      "waste_qty = EXCLUDED.waste_qty, " +
      "updated_at = now() " +
      "RETURNING summary_date AS \"SummaryDate\", total_raw_materials AS \"TotalRawMaterials\", " +
      "low_stock_count AS \"LowStockCount\", equal_stock_count AS \"EqualStockCount\", " +
      "ok_stock_count AS \"OkStockCount\", out_of_stock_count AS \"OutOfStockCount\", " +
      "pending_purchase_count AS \"PendingPurchaseCount\", stock_in_qty AS \"StockInQty\", " +
      "stock_out_qty AS \"StockOutQty\", waste_qty AS \"WasteQty\", " +
      "created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\"",
    [
      summary.SummaryDate,
      summary.TotalRawMaterials,
      summary.LowStockCount,
      summary.EqualStockCount,
      summary.OkStockCount,
      summary.OutOfStockCount,
      summary.PendingPurchaseCount,
      summary.StockInQty,
      summary.StockOutQty,
      summary.WasteQty
    ]
  );

  return result.rows[0];
}

async function listSummariesByDateRange(startDate, endDate) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT summary_date AS \"SummaryDate\", total_raw_materials AS \"TotalRawMaterials\", " +
      "low_stock_count AS \"LowStockCount\", equal_stock_count AS \"EqualStockCount\", " +
      "ok_stock_count AS \"OkStockCount\", out_of_stock_count AS \"OutOfStockCount\", " +
      "pending_purchase_count AS \"PendingPurchaseCount\", stock_in_qty AS \"StockInQty\", " +
      "stock_out_qty AS \"StockOutQty\", waste_qty AS \"WasteQty\" " +
      "FROM public.inventory_daily_summaries " +
      "WHERE summary_date BETWEEN $1 AND $2 " +
      "ORDER BY summary_date DESC",
    [startDate, endDate]
  );

  return result.rows;
}

module.exports = {
  getSummaryByDate,
  upsertSummary,
  listSummariesByDateRange
};
