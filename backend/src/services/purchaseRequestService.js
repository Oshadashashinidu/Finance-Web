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
    CompanyName: payload.companyName || payload.company || "",
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
      CompanyName: request.CompanyName,
      actionToken: request.actionToken
    },
    supplier.Email
  );

  return saved;
}

async function listPurchaseRequests() {
  return purchaseRequestRepository.listPurchaseRequests();
}

async function handlePurchaseAction(action, requestId, token) {
  if (!action || !requestId || !token) {
    throw badRequest("Missing action, requestId, or token.");
  }

  const normalizedAction = String(action).toLowerCase();
  if (normalizedAction !== "approve" && normalizedAction !== "reject") {
    throw badRequest("Invalid action.");
  }

  const request = await purchaseRequestRepository.getPurchaseRequestById(requestId);
  if (!request) {
    const error = new Error("Purchase request not found.");
    error.status = 404;
    throw error;
  }

  if (!request.ActionToken || String(request.ActionToken) !== String(token)) {
    throw badRequest("Invalid token.");
  }

  if (request.TokenExpiresAt && new Date(request.TokenExpiresAt) < new Date()) {
    throw badRequest("This action link has expired.");
  }

  const currentStatus = String(request.Status || "Pending");
  if (currentStatus.toLowerCase() !== "pending") {
    return {
      ...request,
      Status: currentStatus,
      alreadyHandled: true
    };
  }

  const newStatus = normalizedAction === "approve" ? "Approved" : "Rejected";
  const feedback = `${newStatus} via email action`;

  const updated = await purchaseRequestRepository.updatePurchaseRequestStatus(
    requestId,
    newStatus,
    true,
    feedback
  );

  return {
    ...request,
    ...updated,
    Status: newStatus,
    alreadyHandled: false
  };
}

module.exports = {
  createPurchaseRequest,
  listPurchaseRequests,
  handlePurchaseAction
};
