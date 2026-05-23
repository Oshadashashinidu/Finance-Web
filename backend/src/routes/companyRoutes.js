const express = require("express");
const companyController = require("../controllers/companyController");

const router = express.Router();

router.post("/register", companyController.register);
router.post("/login", companyController.login);
router.post("/forgot-password", companyController.requestPasswordReset);
router.post("/verify-reset-code", companyController.verifyResetCode);
router.post("/reset-password", companyController.resetPassword);

module.exports = router;
