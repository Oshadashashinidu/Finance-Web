const express = require("express");
const rawMaterialController = require("../controllers/rawMaterialController");

const router = express.Router();

router.get("/", rawMaterialController.list);
router.post("/", rawMaterialController.create);

module.exports = router;
