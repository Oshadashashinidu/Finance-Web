const express = require("express");
const fifoController = require("../controllers/fifoController");

const router = express.Router();

router.get("/", fifoController.list);

module.exports = router;
