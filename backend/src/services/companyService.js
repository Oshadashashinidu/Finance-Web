const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const companyRepository = require("../repositories/companyRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function registerCompany(payload) {
  const requiredFields = [
    "companyName",
    "businessRegistrationNumber",
    "companyType",
    "industryType",
    "companyAddress",
    "companyEmail",
    "password"
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      throw badRequest(`${field} is required.`);
    }
  }

  if (await companyRepository.existsByBusinessRegistrationNumber(payload.businessRegistrationNumber)) {
    throw badRequest("Business registration number already exists.");
  }

  if (await companyRepository.existsByCompanyEmail(payload.companyEmail)) {
    throw badRequest("Company email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const company = {
    id: uuidv4(),
    companyName: payload.companyName,
    businessRegistrationNumber: payload.businessRegistrationNumber,
    companyType: payload.companyType,
    industryType: payload.industryType,
    companyAddress: payload.companyAddress,
    taxIdentificationNumber: payload.taxIdentificationNumber || null,
    companyEmail: payload.companyEmail,
    passwordHash
  };

  await companyRepository.createCompany(company);

  return {
    companyId: company.id,
    companyName: company.companyName,
    companyEmail: company.companyEmail
  };
}

async function loginCompany(payload) {
  if (!payload.businessRegistrationNumber || !payload.password) {
    throw badRequest("Business registration number and password are required.");
  }

  const company = await companyRepository.findByBusinessRegistrationNumber(
    payload.businessRegistrationNumber
  );

  if (!company) {
    throw badRequest("Invalid credentials.");
  }

  const matches = await bcrypt.compare(payload.password, company.PasswordHash);
  if (!matches) {
    throw badRequest("Invalid credentials.");
  }

  return {
    companyId: company.Id,
    companyName: company.CompanyName,
    companyEmail: company.CompanyEmail
  };
}

module.exports = {
  registerCompany,
  loginCompany
};
