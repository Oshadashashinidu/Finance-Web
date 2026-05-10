const stockIntakeService = require("../services/stockIntakeService");

async function list(req, res, next) {
  try {
    const data = await stockIntakeService.listStockIntakes();
    res.json({
      success: true,
      message: "Stock intakes loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await stockIntakeService.createStockIntake(req.body);
    res.status(201).json({
      success: true,
      message: "Stock intake created successfully.",
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
