const nodemailer = require("nodemailer");
const { loadEmailConfig } = require("../config/emailConfig");

function buildActionUrl(baseUrl, action, token, requestId) {
  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("token", token);
  url.searchParams.set("requestId", requestId);
  return url.toString();
}

function buildPurchaseEmailBody(request, baseUrl) {
  const approveUrl = buildActionUrl(baseUrl, "approve", request.actionToken, request.RequestId);
  const rejectUrl = buildActionUrl(baseUrl, "reject", request.actionToken, request.RequestId);
  const supplierName = request.SupplierName || "Supplier";
  const companyName = request.CompanyName || "The company";
  const quantityLine = `${request.RequestedQuantity} ${request.Unit}`;

  return {
    text:
      `Hello ${supplierName},\n\n` +
      `${companyName} just submitted a purchase request that lists you as the preferred supplier.\n\n` +
      "Request details\n" +
      `Material: ${request.RawMaterialName}\n` +
      `Quantity: ${quantityLine}\n` +
      `Supplier ID: ${request.SupplierId}\n` +
      `Location: ${request.SupplierLocation || ""}\n` +
      `Notes: ${request.Notes || ""}\n` +
      `Request ID: ${request.RequestId}\n\n` +
      "Please confirm availability and lead time at your earliest convenience.\n\n" +
      "\nApprove: " + approveUrl + "\n" +
      "Reject: " + rejectUrl,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin: 0 0 8px;">${companyName} purchase request - ${request.RawMaterialName} (${quantityLine})</h2>
        <p style="margin: 0 0 12px; color: #475569;">Hello ${supplierName},</p>
        <p style="margin: 0 0 16px; color: #475569;">${companyName} just submitted a purchase request that lists you as the preferred supplier.</p>
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; margin-bottom: 16px;">
          <p style="margin: 0 0 12px; font-weight: 700;">Request details</p>
          <ul style="margin: 0; padding-left: 18px; color: #0f172a;">
            <li><strong>Material:</strong> ${request.RawMaterialName}</li>
            <li><strong>Quantity:</strong> ${quantityLine}</li>
            <li><strong>Supplier ID:</strong> ${request.SupplierId}</li>
            <li><strong>Location:</strong> ${request.SupplierLocation || ""}</li>
            <li><strong>Notes:</strong> ${request.Notes || ""}</li>
            <li><strong>Request ID:</strong> ${request.RequestId}</li>
          </ul>
        </div>
        <p style="margin: 0 0 16px; color: #475569;">Please confirm availability and lead time at your earliest convenience.</p>
        <div style="display: flex; gap: 12px;">
          <a href="${approveUrl}" style="background: #16a34a; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 999px; font-weight: 700;">Approve</a>
          <a href="${rejectUrl}" style="background: #ef4444; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 999px; font-weight: 700;">Reject</a>
        </div>
      </div>
    `
  };
}

async function sendPurchaseRequestEmail(request, supplierEmail) {
  const config = loadEmailConfig();
  const secure = Boolean(config.enableSsl && Number(config.port) === 465);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port) || 587,
    secure,
    auth: {
      user: config.userName,
      pass: config.password
    },
    requireTLS: Boolean(config.enableSsl && Number(config.port) !== 465)
  });

  const body = buildPurchaseEmailBody(request, config.purchaseActionBaseUrl);

  const subjectPrefix = request.CompanyName ? `${request.CompanyName} purchase request` : config.subject;
  const subject = `${subjectPrefix} - ${request.RawMaterialName} (${request.RequestedQuantity} ${request.Unit})`;

  await transporter.sendMail({
    from: config.from,
    to: supplierEmail,
    subject,
    text: body.text,
    html: body.html
  });
}

async function sendPasswordResetEmail(email, code) {
  const config = loadEmailConfig();
  const secure = Boolean(config.enableSsl && Number(config.port) === 465);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port) || 587,
    secure,
    auth: {
      user: config.userName,
      pass: config.password
    },
    requireTLS: Boolean(config.enableSsl && Number(config.port) !== 465)
  });

  const subject = "Password reset verification code";
  const text = `Your verification code is ${code}. This code expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2 style="margin: 0 0 8px;">Password reset verification</h2>
      <p style="margin: 0 0 12px; color: #475569;">Use the code below to reset your password.</p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; padding: 12px 16px; background: #f1f5f9; border-radius: 12px; width: fit-content;">
        ${code}
      </div>
      <p style="margin: 12px 0 0; color: #475569;">This code expires in 10 minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject,
    text,
    html
  });
}

module.exports = {
  sendPurchaseRequestEmail,
  sendPasswordResetEmail
};
