const stockReturnService = require("../services/stockReturnService");

async function getAvailableBatches(req, res, next) {
  try {
    const materialId = req.query.materialId;
    if (!materialId) {
      return res.status(400).json({ success: false, message: "materialId required" });
    }
    const rows = await stockReturnService.getAvailableBatches(materialId);
    return res.json({ success: true, message: "Available batches", data: rows });
  } catch (error) {
    return next(error);
  }
}

async function createReturn(req, res, next) {
  try {
    const payload = req.body;
    const created = await stockReturnService.createReturn(payload);
    return res.json({ success: true, message: "Stock return recorded", data: created });
  } catch (error) {
    return next(error);
  }
}

async function listReturns(req, res, next) {
  try {
    const rows = await stockReturnService.listReturns();
    return res.json({ success: true, message: "Stock returns", data: rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAvailableBatches,
  createReturn,
  listReturns
};
