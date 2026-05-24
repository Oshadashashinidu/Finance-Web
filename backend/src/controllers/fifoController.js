const fifoService = require("../services/fifoService");

async function list(req, res, next) {
  try {
    const data = await fifoService.listFifoByMaterialId(req.query.materialId);
    res.json({
      success: true,
      message: "FIFO entries loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list
};
