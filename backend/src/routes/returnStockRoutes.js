const express = require("express");
const returnStockController = require("../controllers/returnStockController");

const router = express.Router();

router.get("/", returnStockController.list);
router.get("/batches", returnStockController.listBatches);
router.post("/", returnStockController.create);

module.exports = router;
