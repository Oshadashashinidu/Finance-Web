const stockIssueService = require("../services/stockIssueService");

async function list(req, res, next) {
  try {
    const data = await stockIssueService.listStockIssues();
    res.json({
      success: true,
      message: "Stock issues loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await stockIssueService.createStockIssue(req.body);
    res.status(201).json({
      success: true,
      message: "Stock issue created successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create
};
