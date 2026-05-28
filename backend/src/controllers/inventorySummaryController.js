const inventorySummaryService = require("../services/inventorySummaryService");

async function getSummary(req, res, next) {
  try {
    if (req.query.date) {
      const summary = await inventorySummaryService.getSummaryForDate(req.query.date);
      const change = await inventorySummaryService.getChangeForDate(req.query.date);
      const reorderAlerts = await inventorySummaryService.getReorderAlerts();
      const pendingRequests = await inventorySummaryService.getPendingRequests();

      return res.json({
        success: true,
        message: "Inventory summary loaded successfully.",
        data: {
          summary,
          summaries: [summary],
          change,
          changes: [change],
          reorderAlerts,
          pendingRequests
        }
      });
    }

    const range = req.query.range || "today";
    const summaries = await inventorySummaryService.getSummaryForRange(range);
    const changes = await Promise.all(
      summaries.map((summary) => inventorySummaryService.getChangeForDate(summary.SummaryDate))
    );
    const reorderAlerts = await inventorySummaryService.getReorderAlerts();
    const pendingRequests = await inventorySummaryService.getPendingRequests();

    return res.json({
      success: true,
      message: "Inventory summary loaded successfully.",
      data: {
        summary: summaries[0] || null,
        summaries,
          change: changes[0] || null,
          changes,
        reorderAlerts,
        pendingRequests
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummary
};
