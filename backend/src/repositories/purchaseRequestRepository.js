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

module.exports = {
  createPurchaseRequest,
  listPurchaseRequests
};
