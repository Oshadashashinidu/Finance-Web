const { getPool } = require("../config/database");
const inventorySummaryRepository = require("../repositories/inventorySummaryRepository");
const inventoryChangeRepository = require("../repositories/inventoryChangeRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateList(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "yesterday") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return [d];
  }

  if (range === "last10") {
    const days = [];
    for (let i = 0; i < 10; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  return [today];
}

function isTodayOrYesterday(summaryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const normalized = toDateOnly(summaryDate);
  return normalized === toDateOnly(today) || normalized === toDateOnly(yesterday);
}

async function computeSummaryForDate(summaryDate) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT " +
      "(SELECT COUNT(*) FROM public.raw_materials) AS total_raw_materials, " +
      "(SELECT COUNT(*) FROM public.raw_materials WHERE \"CurrentQuantity\" <= \"ReorderLevel\") AS low_stock_count, " +
      "(SELECT COUNT(*) FROM public.raw_materials WHERE \"CurrentQuantity\" = \"ReorderLevel\") AS equal_stock_count, " +
      "(SELECT COUNT(*) FROM public.raw_materials WHERE \"CurrentQuantity\" > \"ReorderLevel\") AS ok_stock_count, " +
      "(SELECT COUNT(*) FROM public.raw_materials WHERE \"CurrentQuantity\" <= 0) AS out_of_stock_count, " +
      "(SELECT COUNT(*) FROM public.purchase_requests WHERE \"Status\" = 'Pending') AS pending_purchase_count, " +
      "(SELECT COALESCE(SUM(\"Quantity\"), 0) FROM public.stock_intakes WHERE \"IntakeDate\"::date = $1) AS stock_in_qty, " +
      "(SELECT COALESCE(SUM(\"Quantity\"), 0) FROM public.stock_issues WHERE \"IssueDate\"::date = $1) AS stock_out_qty, " +
      "(SELECT COALESCE(SUM(quantity), 0) FROM public.waste_stocks WHERE wastedate::date = $1) AS waste_qty",
    [summaryDate]
  );

  const row = result.rows[0] || {};
  return {
    SummaryDate: summaryDate,
    TotalRawMaterials: Number(row.total_raw_materials) || 0,
    LowStockCount: Number(row.low_stock_count) || 0,
    EqualStockCount: Number(row.equal_stock_count) || 0,
    OkStockCount: Number(row.ok_stock_count) || 0,
    OutOfStockCount: Number(row.out_of_stock_count) || 0,
    PendingPurchaseCount: Number(row.pending_purchase_count) || 0,
    StockInQty: Number(row.stock_in_qty) || 0,
    StockOutQty: Number(row.stock_out_qty) || 0,
    WasteQty: Number(row.waste_qty) || 0
  };
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

async function computeChangeForDate(summaryDate) {
  const currentDate = toDateOnly(summaryDate);
  if (!currentDate) {
    throw badRequest("Invalid date.");
  }

  const previousDate = toDateOnly(addDays(currentDate, -1));
  const currentSummary = await computeSummaryForDate(currentDate);
  const previousSummary = previousDate
    ? await computeSummaryForDate(previousDate)
    : {
        TotalRawMaterials: 0,
        LowStockCount: 0,
        PendingPurchaseCount: 0,
        OutOfStockCount: 0,
        StockInQty: 0,
        StockOutQty: 0,
        WasteQty: 0
      };

  return {
    ChangeDate: currentDate,
    TotalRawMaterialsDelta: currentSummary.TotalRawMaterials - previousSummary.TotalRawMaterials,
    LowStockDelta: currentSummary.LowStockCount - previousSummary.LowStockCount,
    PendingPurchaseDelta: currentSummary.PendingPurchaseCount - previousSummary.PendingPurchaseCount,
    OutOfStockDelta: currentSummary.OutOfStockCount - previousSummary.OutOfStockCount,
    StockInDelta: currentSummary.StockInQty - previousSummary.StockInQty,
    StockOutDelta: currentSummary.StockOutQty - previousSummary.StockOutQty,
    WasteDelta: currentSummary.WasteQty - previousSummary.WasteQty
  };
}

async function getChangeForDate(dateValue) {
  const changeDate = toDateOnly(dateValue);
  if (!changeDate) {
    throw badRequest("Invalid date.");
  }

  const computed = await computeChangeForDate(changeDate);
  return inventoryChangeRepository.upsertChange(computed);
}

async function getReorderAlerts() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"MaterialId\", \"MaterialName\", \"CurrentQuantity\", \"ReorderLevel\", \"Unit\", " +
      "\"Status\" FROM public.raw_materials " +
      "WHERE \"CurrentQuantity\" <= \"ReorderLevel\" ORDER BY \"MaterialName\" ASC"
  );

  return result.rows;
}

async function getPendingRequests() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"RequestId\", \"SupplierName\", \"RawMaterialName\", \"RequestedQuantity\", \"Unit\", " +
      "\"Status\", \"CreatedAt\" FROM public.purchase_requests " +
      "WHERE \"Status\" = 'Pending' ORDER BY \"CreatedAt\" DESC"
  );

  return result.rows;
}

async function getSummaryForDate(dateValue) {
  const summaryDate = toDateOnly(dateValue);
  if (!summaryDate) {
    throw badRequest("Invalid date.");
  }

  if (isTodayOrYesterday(summaryDate)) {
    const computed = await computeSummaryForDate(summaryDate);
    return inventorySummaryRepository.upsertSummary(computed);
  }

  const existing = await inventorySummaryRepository.getSummaryByDate(summaryDate);
  if (existing) {
    return existing;
  }

  const computed = await computeSummaryForDate(summaryDate);
  return inventorySummaryRepository.upsertSummary(computed);
}

async function getSummaryForRange(range) {
  const normalized = range || "today";
  const dates = getDateList(normalized);
  const summaries = [];

  for (const d of dates) {
    const summaryDate = d.toISOString().slice(0, 10);
    let summary;
    if (isTodayOrYesterday(summaryDate)) {
      summary = await inventorySummaryRepository.upsertSummary(
        await computeSummaryForDate(summaryDate)
      );
    } else {
      summary = await inventorySummaryRepository.getSummaryByDate(summaryDate);
      if (!summary) {
        summary = await inventorySummaryRepository.upsertSummary(
          await computeSummaryForDate(summaryDate)
        );
      }
    }
    summaries.push(summary);
  }

  return summaries;
}

module.exports = {
  getSummaryForDate,
  getSummaryForRange,
  getChangeForDate,
  getReorderAlerts,
  getPendingRequests
};
