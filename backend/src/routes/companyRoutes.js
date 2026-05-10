const express = require("express");
const companyController = require("../controllers/companyController");

const router = express.Router();

router.post("/register", companyController.register);
router.post("/login", companyController.login);

module.exports = router;
