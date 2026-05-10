const rawMaterialRepository = require("../repositories/rawMaterialRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

async function listRawMaterials() {
  return rawMaterialRepository.listRawMaterials();
}

async function createRawMaterial(payload) {
  if (!payload.materialName) {
    throw badRequest("materialName is required.");
  }

  if (payload.reorderLevel === undefined || payload.currentQuantity === undefined) {
    throw badRequest("reorderLevel and currentQuantity are required.");
  }

  const reorderLevel = toNumber(payload.reorderLevel, 0);
  const currentQuantity = toNumber(payload.currentQuantity, 0);
  const totalCost = toNumber(payload.totalCost, 0);
  if (Number.isNaN(totalCost)) {
    throw badRequest("totalCost must be a number.");
  }

  const unitCost = currentQuantity > 0 ? totalCost / currentQuantity : 0;
  const unit = payload.unit || "kg";
  const status = currentQuantity > reorderLevel
    ? "OK"
    : currentQuantity === reorderLevel
      ? "Equal"
      : "Low";

  const materialId = await rawMaterialRepository.getNextMaterialId();

  const material = {
    materialId,
    materialName: payload.materialName,
    reorderLevel,
    currentQuantity,
    unit,
    unitCost,
    totalCost,
    status
  };

  await rawMaterialRepository.createRawMaterial(material);
  return material;
}

module.exports = {
  listRawMaterials,
  createRawMaterial
};
