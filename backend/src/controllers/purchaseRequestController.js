const purchaseRequestService = require("../services/purchaseRequestService");

async function list(req, res, next) {
  try {
    const data = await purchaseRequestService.listPurchaseRequests();
    res.json({
      success: true,
      message: "Purchase requests loaded successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await purchaseRequestService.createPurchaseRequest(req.body);
    res.status(201).json({
      success: true,
      message: "Purchase request created successfully.",
      data
    });
  } catch (error) {
    next(error);
  }
}

function renderActionPage({
  status,
  supplierName,
  companyName,
  materialName,
  quantity,
  unit,
  requestId,
  message,
  alreadyHandled
}) {
  const normalizedStatus = String(status || "Pending");
  const statusTone = normalizedStatus.toLowerCase();
  const approveDisabled = statusTone === "approved" || alreadyHandled;
  const rejectDisabled = statusTone === "rejected" || alreadyHandled;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 640px; margin: 32px auto; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; background: #ffffff;">
      <h2 style="margin: 0 0 8px; font-size: 22px;">${companyName || "The company"} purchase request</h2>
      <p style="margin: 0 0 16px; color: #475569;">Hello ${supplierName || "Supplier"}, the request status is shown below.</p>
      <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; font-weight: 700; background: ${statusTone === "approved" ? "#dcfce7" : statusTone === "rejected" ? "#fee2e2" : "#e0f2fe"}; color: ${statusTone === "approved" ? "#15803d" : statusTone === "rejected" ? "#b91c1c" : "#0369a1"};">
        ${normalizedStatus}
      </div>
      <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px;"><strong>Material:</strong> ${materialName || ""}</p>
        <p style="margin: 0 0 6px;"><strong>Quantity:</strong> ${quantity || ""} ${unit || ""}</p>
        <p style="margin: 0;"><strong>Request ID:</strong> ${requestId || ""}</p>
      </div>
      <p style="margin: 16px 0; color: #475569;">${message || ""}</p>
      <div style="display: flex; gap: 12px;">
        <button style="background: ${approveDisabled ? "#cbd5f5" : "#22c55e"}; color: #fff; padding: 10px 18px; border: none; border-radius: 999px; font-weight: 700; cursor: ${approveDisabled ? "not-allowed" : "pointer"};" ${approveDisabled ? "disabled" : ""}>${statusTone === "approved" ? "Approved" : "Approve"}</button>
        <button style="background: ${rejectDisabled ? "#fecaca" : "#ef4444"}; color: #fff; padding: 10px 18px; border: none; border-radius: 999px; font-weight: 700; cursor: ${rejectDisabled ? "not-allowed" : "pointer"};" ${rejectDisabled ? "disabled" : ""}>${statusTone === "rejected" ? "Rejected" : "Reject"}</button>
      </div>
    </div>
  `;
}

async function handleAction(req, res, next) {
  try {
    const { action, token, requestId } = req.query;
    const result = await purchaseRequestService.handlePurchaseAction(action, requestId, token);

    const html = renderActionPage({
      status: result.Status,
      supplierName: result.SupplierName,
      companyName: result.CompanyName,
      materialName: result.RawMaterialName,
      quantity: result.RequestedQuantity,
      unit: result.Unit,
      requestId: result.RequestId,
      alreadyHandled: result.alreadyHandled,
      message: result.alreadyHandled
        ? "This request was already handled."
        : `The request has been ${String(result.Status).toLowerCase()}.`
    });

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (error) {
    const html = renderActionPage({
      status: "Pending",
      message: error.message || "Unable to process this action."
    });
    res.setHeader("Content-Type", "text/html");
    res.status(error.status || 400).send(html);
  }
}

module.exports = {
  list,
  create,
  handleAction
};
