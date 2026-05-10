export default function LoginForm({ values, onChange, onSubmit, loading }) {
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
        <input
          type="password"
          name="password"
          value={values.password}
          onChange={onChange}
          required
        />
      </label>

      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
