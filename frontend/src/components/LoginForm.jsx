import { useState } from "react";

export default function LoginForm({ values, onChange, onSubmit, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="form">
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
        Password
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={values.password}
            onChange={onChange}
            required
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
