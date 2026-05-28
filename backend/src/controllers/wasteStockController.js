const wasteStockService = require("../services/wasteStockService");

async function list(req, res, next) {
  try {
    const data = await wasteStockService.listWasteStocks();
    res.json({
      success: true,
      message: "Waste stocks loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await wasteStockService.createWasteStock(req.body);
    res.status(201).json({
      success: true,
      message: "Waste stock recorded successfully.",
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
