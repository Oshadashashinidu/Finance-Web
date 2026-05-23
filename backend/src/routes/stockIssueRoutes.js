const express = require("express");
const stockIssueController = require("../controllers/stockIssueController");

const router = express.Router();

router.get("/", stockIssueController.list);
router.post("/", stockIssueController.create);

module.exports = router;
