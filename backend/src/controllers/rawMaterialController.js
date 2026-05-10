const rawMaterialService = require("../services/rawMaterialService");

async function list(req, res, next) {
  try {
    const data = await rawMaterialService.listRawMaterials();
    res.json({
      success: true,
      message: "Raw materials loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await rawMaterialService.createRawMaterial(req.body);
    res.status(201).json({
      success: true,
      message: "Raw material created successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create
};
