export default function RegisterForm({ values, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="form">
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
        <input name="companyType" value={values.companyType} onChange={onChange} required />
      </label>
      <label>
        Industry type
        <input name="industryType" value={values.industryType} onChange={onChange} required />
      </label>
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
      <label>
        Company image
        <input type="file" name="companyImage" accept="image/*" onChange={onChange} />
      </label>

      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register company"}
      </button>
    </form>
  );
}
