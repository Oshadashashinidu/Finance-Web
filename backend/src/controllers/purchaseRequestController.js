const purchaseRequestService = require("../services/purchaseRequestService");

async function list(req, res, next) {
  try {
    const data = await purchaseRequestService.listPurchaseRequests();
    res.json({
      success: true,
      message: "Purchase requests loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await purchaseRequestService.createPurchaseRequest(req.body);
    res.status(201).json({
      success: true,
      message: "Purchase request created successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function handleAction(req, res, next) {
  try {
    const data = await purchaseRequestService.handlePurchaseRequestAction({
      action: req.query.action,
      token: req.query.token,
      requestId: req.query.requestId,
      feedback: req.query.feedback
    });
    res.json({
      success: true,
      message: "Purchase request updated successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  handleAction
};
