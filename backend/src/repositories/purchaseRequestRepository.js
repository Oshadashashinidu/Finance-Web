const { getPool } = require("../config/database");

async function createPurchaseRequest(request) {
  const pool = getPool();
  const result = await pool.query(
    "INSERT INTO public.purchase_requests (\"RequestId\", \"SupplierId\", \"SupplierName\", \"SupplierLocation\", \"RawMaterialName\", \"RequestedQuantity\", \"Unit\", \"Notes\", \"Status\", \"action_token\", \"token_expires_at\") " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) " +
      "RETURNING \"RequestId\", \"SupplierId\", \"SupplierName\", \"SupplierLocation\", \"RawMaterialName\", \"RequestedQuantity\", \"Unit\", \"Notes\", \"Status\", \"CreatedAt\", \"action_token\"",
    [
      request.RequestId,
      request.SupplierId,
      request.SupplierName,
      request.SupplierLocation,
      request.RawMaterialName,
      request.RequestedQuantity,
      request.Unit,
      request.Notes,
      request.Status,
      request.actionToken,
      request.tokenExpiresAt
    ]
  );

  return result.rows[0];
}

async function listPurchaseRequests() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"RequestId\", \"SupplierId\", \"SupplierName\", \"SupplierLocation\", \"RawMaterialName\", " +
      "\"RequestedQuantity\", \"Unit\", \"Notes\", \"Status\", \"CreatedAt\" " +
      "FROM public.purchase_requests ORDER BY \"CreatedAt\" DESC"
  );

  return result.rows;
}

async function getPurchaseRequestById(requestId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"RequestId\", \"SupplierId\", \"SupplierName\", \"SupplierLocation\", \"RawMaterialName\", " +
      "\"RequestedQuantity\", \"Unit\", \"Notes\", \"Status\", \"CreatedAt\", " +
      "action_token AS \"ActionToken\", token_expires_at AS \"TokenExpiresAt\", token_used AS \"TokenUsed\" " +
      "FROM public.purchase_requests WHERE \"RequestId\" = $1",
    [requestId]
  );

  return result.rows[0];
}

async function updatePurchaseRequestStatus(requestId, status, tokenUsed, feedback) {
  const pool = getPool();
  const result = await pool.query(
    "UPDATE public.purchase_requests " +
      "SET \"Status\" = $2, token_used = $3, \"Feedback\" = $4 " +
      "WHERE \"RequestId\" = $1 " +
      "RETURNING \"RequestId\", \"Status\", \"SupplierName\", \"RawMaterialName\", \"RequestedQuantity\", \"Unit\"",
    [requestId, status, tokenUsed, feedback]
  );

  return result.rows[0];
}

module.exports = {
  createPurchaseRequest,
  listPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequestStatus
};
