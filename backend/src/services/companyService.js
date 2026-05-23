const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const companyRepository = require("../repositories/companyRepository");
const { sendPasswordResetEmail } = require("./emailService");

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

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestPasswordReset(payload) {
  if (!payload.companyEmail) {
    throw badRequest("companyEmail is required.");
  }

  const company = await companyRepository.findByCompanyEmail(payload.companyEmail);
  if (!company) {
    throw badRequest("Email is not registered.");
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await companyRepository.updateResetCode(payload.companyEmail, code, expiresAt);
  await sendPasswordResetEmail(payload.companyEmail, code);

  return { companyEmail: payload.companyEmail };
}

async function verifyResetCode(payload) {
  if (!payload.companyEmail || !payload.code) {
    throw badRequest("companyEmail and code are required.");
  }

  const company = await companyRepository.findByCompanyEmail(payload.companyEmail);
  if (!company) {
    throw badRequest("Email is not registered.");
  }

  if (!company.ResetCode || String(company.ResetCode) !== String(payload.code)) {
    throw badRequest("Invalid verification code.");
  }

  if (company.ResetCodeExpiresAt && new Date(company.ResetCodeExpiresAt) < new Date()) {
    throw badRequest("Verification code has expired.");
  }

  return { companyEmail: payload.companyEmail };
}

async function resetPassword(payload) {
  if (!payload.companyEmail || !payload.code || !payload.password) {
    throw badRequest("companyEmail, code, and password are required.");
  }

  const company = await companyRepository.findByCompanyEmail(payload.companyEmail);
  if (!company) {
    throw badRequest("Email is not registered.");
  }

  if (!company.ResetCode || String(company.ResetCode) !== String(payload.code)) {
    throw badRequest("Invalid verification code.");
  }

  if (company.ResetCodeExpiresAt && new Date(company.ResetCodeExpiresAt) < new Date()) {
    throw badRequest("Verification code has expired.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  await companyRepository.updatePasswordByEmail(payload.companyEmail, passwordHash);
  await companyRepository.clearResetCode(payload.companyEmail);

  return { companyEmail: payload.companyEmail };
}

module.exports = {
  registerCompany,
  loginCompany,
  requestPasswordReset,
  verifyResetCode,
  resetPassword
};
