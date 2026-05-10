const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.resolve(process.cwd(), "config", "db.config.json");

function loadDbConfig() {
  const defaults = {
    databaseUrl: "",
    ssl: true,
    sslRejectUnauthorized: false,
    overrideEnv: true
  };

  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    fileConfig = JSON.parse(raw);
  }

  const settings = { ...defaults, ...fileConfig };

  if (settings.overrideEnv) {
    if (process.env.DATABASE_URL) {
      settings.databaseUrl = process.env.DATABASE_URL;
    } else if (process.env.POSTGRES_HOST) {
      const host = process.env.POSTGRES_HOST;
      const user = process.env.POSTGRES_USER || "postgres";
      const password = process.env.POSTGRES_PASSWORD || "";
      const database = process.env.POSTGRES_DATABASE || "postgres";
      const port = process.env.POSTGRES_PORT || "5432";
      const encodedUser = encodeURIComponent(user);
      const encodedPassword = encodeURIComponent(password);

      settings.databaseUrl = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
    }

    if (process.env.POSTGRES_SSL !== undefined) {
      settings.ssl = String(process.env.POSTGRES_SSL).toLowerCase() === "true";
    }

    if (process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== undefined) {
      settings.sslRejectUnauthorized =
        String(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED).toLowerCase() === "true";
    }
  }

  if (!settings.databaseUrl) {
    throw new Error("databaseUrl is required. Update config/db.config.json or set DATABASE_URL.");
  }

  return settings;
}

module.exports = {
  loadDbConfig
};
