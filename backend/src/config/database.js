const { Pool } = require("pg");
const { loadDbConfig } = require("./dbConfig");

let pool;

function normalizeDatabaseUrl(databaseUrl) {
  if (databaseUrl.startsWith("jdbc:")) {
    return databaseUrl.replace("jdbc:", "");
  }

  return databaseUrl;
}

function getPool() {
  if (!pool) {
    const settings = loadDbConfig();
    const connectionString = normalizeDatabaseUrl(settings.databaseUrl);

    pool = new Pool({
      connectionString,
      ssl: settings.ssl ? { rejectUnauthorized: settings.sslRejectUnauthorized } : false
    });
  }

  return pool;
}

module.exports = {
  getPool
};
