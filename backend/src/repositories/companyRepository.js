const { getPool } = require("../config/database");

async function existsByBusinessRegistrationNumber(businessRegistrationNumber) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT 1 FROM public.companies WHERE \"BusinessRegistrationNumber\" = $1 LIMIT 1",
    [businessRegistrationNumber]
  );

  return result.rowCount > 0;
}

async function existsByCompanyEmail(companyEmail) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT 1 FROM public.companies WHERE \"CompanyEmail\" = $1 LIMIT 1",
    [companyEmail]
  );

  return result.rowCount > 0;
}

async function findByBusinessRegistrationNumber(businessRegistrationNumber) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"Id\", \"CompanyName\", \"CompanyEmail\", \"PasswordHash\" " +
      "FROM public.companies WHERE \"BusinessRegistrationNumber\" = $1 LIMIT 1",
    [businessRegistrationNumber]
  );

  return result.rows[0] || null;
}

async function findByCompanyEmail(companyEmail) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT \"Id\", \"CompanyName\", \"CompanyEmail\", \"PasswordHash\", \"ResetCode\", \"ResetCodeExpiresAt\" " +
      "FROM public.companies WHERE \"CompanyEmail\" = $1 LIMIT 1",
    [companyEmail]
  );

  return result.rows[0] || null;
}

async function createCompany(company) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO public.companies (\"Id\", \"CompanyName\", \"BusinessRegistrationNumber\", \"CompanyType\", \"IndustryType\", \"CompanyAddress\", \"TaxIdentificationNumber\", \"CompanyEmail\", \"PasswordHash\") " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [
      company.id,
      company.companyName,
      company.businessRegistrationNumber,
      company.companyType,
      company.industryType,
      company.companyAddress,
      company.taxIdentificationNumber,
      company.companyEmail,
      company.passwordHash
    ]
  );
}

async function updateResetCode(companyEmail, resetCode, expiresAt) {
  const pool = getPool();
  await pool.query(
    "UPDATE public.companies SET \"ResetCode\" = $2, \"ResetCodeExpiresAt\" = $3 WHERE \"CompanyEmail\" = $1",
    [companyEmail, resetCode, expiresAt]
  );
}

async function clearResetCode(companyEmail) {
  const pool = getPool();
  await pool.query(
    "UPDATE public.companies SET \"ResetCode\" = NULL, \"ResetCodeExpiresAt\" = NULL WHERE \"CompanyEmail\" = $1",
    [companyEmail]
  );
}

async function updatePasswordByEmail(companyEmail, passwordHash) {
  const pool = getPool();
  await pool.query(
    "UPDATE public.companies SET \"PasswordHash\" = $2 WHERE \"CompanyEmail\" = $1",
    [companyEmail, passwordHash]
  );
}

module.exports = {
  existsByBusinessRegistrationNumber,
  existsByCompanyEmail,
  findByBusinessRegistrationNumber,
  findByCompanyEmail,
  createCompany,
  updateResetCode,
  clearResetCode,
  updatePasswordByEmail
};
