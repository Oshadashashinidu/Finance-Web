import { useState } from "react";

const COMPANY_TYPES = [
  "Private Limited Company (Pvt Ltd)",
  "Public Limited Company (PLC)",
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Partnership (LLP)",
  "Cooperative",
  "Joint Venture",
  "Government-Owned / State-Owned Enterprise"
];

const INDUSTRY_TYPES = [
  "Food & Beverages",
  "Textile & Garments",
  "Electronics & Electrical Equipment",
  "Machinery & Industrial Equipment",
  "Pharmaceuticals & Chemicals",
  "Plastic & Rubber Products",
  "Paper & Packaging",
  "Automotive & Vehicle Components",
  "Metal & Steel Products",
  "Furniture & Wood Products",
  "Cosmetics & Personal Care Products",
  "Printing & Publishing",
  "Glass & Ceramics",
  "Construction Materials (Cement, Bricks, Tiles)",
  "Beverage & Bottling Industry",
  "Leather & Footwear",
  "Additive Manufacturing / 3D Printing",
  "Other (Please specify)"
];

export default function RegisterForm({ values, onChange, onSubmit, loading }) {
  const [step, setStep] = useState(1);

  return (
    <form onSubmit={onSubmit} className="form">
      {step === 1 ? (
        <>
          <label>
            Company name
            <input name="companyName" value={values.companyName} onChange={onChange} required />
          </label>
          <label>
            Business registration number
            <input
              name="businessRegistrationNumber"
              value={values.businessRegistrationNumber}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Company type
            <select name="companyType" value={values.companyType} onChange={onChange} required>
              <option value="">Select company type</option>
              {COMPANY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Industry type
            <select name="industryType" value={values.industryType} onChange={onChange} required>
              <option value="">Select industry type</option>
              {INDUSTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button className="primary" type="button" onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <label>
            Company address
            <input name="companyAddress" value={values.companyAddress} onChange={onChange} required />
          </label>
          <label>
            Tax identification number (optional)
            <input
              name="taxIdentificationNumber"
              value={values.taxIdentificationNumber}
              onChange={onChange}
            />
          </label>
          <label>
            Company email
            <input
              type="email"
              name="companyEmail"
              value={values.companyEmail}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={onChange}
              required
            />
          </label>
          <div className="form-actions">
            <button className="ghost" type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register company"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
