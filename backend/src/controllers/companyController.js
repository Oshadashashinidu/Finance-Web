const companyService = require("../services/companyService");

async function register(req, res, next) {
  try {
    const data = await companyService.registerCompany(req.body);
    return res.status(201).json({
      success: true,
      message: "Company registered successfully.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await companyService.loginCompany(req.body);
    return res.json({
      success: true,
      message: "Login successful.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const data = await companyService.requestPasswordReset(req.body);
    return res.json({
      success: true,
      message: "Verification code sent.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyResetCode(req, res, next) {
  try {
    const data = await companyService.verifyResetCode(req.body);
    return res.json({
      success: true,
      message: "Verification code verified.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await companyService.resetPassword(req.body);
    return res.json({
      success: true,
      message: "Password updated successfully.",
      data
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  requestPasswordReset,
  verifyResetCode,
  resetPassword
};
