const express = require("express");
const inventorySummaryController = require("../controllers/inventorySummaryController");

const router = express.Router();

router.get("/", inventorySummaryController.getSummary);

module.exports = router;
