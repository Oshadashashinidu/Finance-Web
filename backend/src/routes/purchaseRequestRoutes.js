const express = require("express");
const purchaseRequestController = require("../controllers/purchaseRequestController");

const router = express.Router();

router.get("/", purchaseRequestController.list);
router.get("/action", purchaseRequestController.handleAction);
router.post("/", purchaseRequestController.create);

module.exports = router;
