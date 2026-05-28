const express = require("express");
const wasteStockController = require("../controllers/wasteStockController");

const router = express.Router();

router.get("/", wasteStockController.list);
router.post("/", wasteStockController.create);

module.exports = router;
