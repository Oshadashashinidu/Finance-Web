const fifoRepository = require("../repositories/fifoRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function listFifoByMaterialId(materialId) {
  if (!materialId) {
    throw badRequest("materialId is required.");
  }

  return fifoRepository.listFifoByMaterialId(materialId);
}

module.exports = {
  listFifoByMaterialId
};
