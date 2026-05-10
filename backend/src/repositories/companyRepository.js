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

module.exports = {
  existsByBusinessRegistrationNumber,
  existsByCompanyEmail,
  findByBusinessRegistrationNumber,
  createCompany
};
