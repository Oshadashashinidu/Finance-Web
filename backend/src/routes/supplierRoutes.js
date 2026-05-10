const express = require("express");
const supplierController = require("../controllers/supplierController");

const router = express.Router();

router.get("/", supplierController.list);
router.post("/", supplierController.create);

module.exports = router;
