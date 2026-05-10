const express = require("express");
const stockIntakeController = require("../controllers/stockIntakeController");

const router = express.Router();

router.get("/", stockIntakeController.list);
router.post("/", stockIntakeController.create);

module.exports = router;
