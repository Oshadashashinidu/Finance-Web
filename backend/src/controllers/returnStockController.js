const returnStockService = require("../services/returnStockService");

async function list(req, res, next) {
  try {
    const data = await returnStockService.listReturnStocks();
    res.json({
      success: true,
      message: "Return stocks loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function listBatches(req, res, next) {
  try {
    const data = await returnStockService.listReturnableBatches(req.query.materialId);
    res.json({
      success: true,
      message: "Return batches loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await returnStockService.createReturnStock(req.body);
    res.status(201).json({
      success: true,
      message: "Return stock created successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  listBatches,
  create
};
