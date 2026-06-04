const express = require("express");
const controller = require("../controllers/stockReturnController");

const router = express.Router();

router.get("/available", controller.getAvailableBatches);
router.post("/", controller.createReturn);
router.get("/", controller.listReturns);

module.exports = router;
