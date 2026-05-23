const { v4: uuidv4 } = require("uuid");
const purchaseRequestRepository = require("../repositories/purchaseRequestRepository");
const supplierRepository = require("../repositories/supplierRepository");
const { sendPurchaseRequestEmail } = require("./emailService");

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

async function createPurchaseRequest(payload) {
  if (!payload.supplierId) {
    throw badRequest("supplierId is required.");
  }
  if (!payload.rawMaterialName) {
    throw badRequest("rawMaterialName is required.");
  }

  const quantity = toNumber(payload.requestedQuantity, 0);
  if (quantity <= 0) {
    throw badRequest("requestedQuantity must be a valid number.");
  }

  const supplier = await supplierRepository.getSupplierById(payload.supplierId);
  if (!supplier) {
    throw badRequest("Supplier not found.");
  }

  const request = {
    RequestId: uuidv4(),
    SupplierId: supplier.SupplierId,
    SupplierName: supplier.SupplierName,
    SupplierLocation: supplier.Location || "",
    RawMaterialName: payload.rawMaterialName,
    RequestedQuantity: quantity,
    Unit: payload.unit || "kg",
    Notes: payload.notes || "",
    Status: "Pending",
    actionToken: uuidv4(),
    tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  const saved = await purchaseRequestRepository.createPurchaseRequest(request);

  await sendPurchaseRequestEmail(
    {
      ...saved,
      actionToken: request.actionToken
    },
    supplier.Email
  );

  return saved;
}

async function listPurchaseRequests() {
  return purchaseRequestRepository.listPurchaseRequests();
}

module.exports = {
  createPurchaseRequest,
  listPurchaseRequests
};
