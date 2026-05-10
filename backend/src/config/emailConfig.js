const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.resolve(process.cwd(), "config", "email.config.json");

function loadEmailConfig() {
  const defaults = {
    host: "",
    port: 587,
    enableSsl: true,
    userName: "",
    password: "",
    from: "",
    subject: "Purchase Request",
    purchaseActionBaseUrl: "",
    overrideEnv: true
  };

  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    fileConfig = JSON.parse(raw);
  }

  const settings = { ...defaults, ...fileConfig };

  if (settings.overrideEnv) {
    settings.host = process.env.EMAIL_HOST || settings.host;
    settings.port = Number(process.env.EMAIL_PORT || settings.port || 587);
    if (process.env.EMAIL_ENABLE_SSL !== undefined) {
      settings.enableSsl = String(process.env.EMAIL_ENABLE_SSL).toLowerCase() === "true";
    }
    settings.userName = process.env.EMAIL_USERNAME || settings.userName;
    settings.password = process.env.EMAIL_PASSWORD || settings.password;
    settings.from = process.env.EMAIL_FROM || settings.from;
    settings.subject = process.env.EMAIL_SUBJECT || settings.subject;
    settings.purchaseActionBaseUrl =
      process.env.PURCHASE_ACTION_BASE_URL || settings.purchaseActionBaseUrl;
  }

  if (!settings.host || !settings.userName || !settings.password || !settings.from) {
    throw new Error("Email configuration is incomplete. Update config/email.config.json or set EMAIL_* env vars.");
  }

  return settings;
}

module.exports = {
  loadEmailConfig
};
