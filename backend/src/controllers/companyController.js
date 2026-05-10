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

module.exports = {
  register,
  login
};
