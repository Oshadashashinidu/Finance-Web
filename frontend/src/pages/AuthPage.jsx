import { useMemo, useState } from "react";
import { loginCompany, registerCompany } from "../api";
import Logo from "../components/Logo";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { fileToBase64 } from "../utils/fileHelpers";

const initialSignup = {
  companyName: "",
  businessRegistrationNumber: "",
  companyType: "",
  industryType: "",
  companyAddress: "",
  taxIdentificationNumber: "",
  companyEmail: "",
  password: "",
  companyImageName: "",
  companyImage: ""
};

const initialLogin = {
  businessRegistrationNumber: "",
  password: ""
};

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [signup, setSignup] = useState(initialSignup);
  const [login, setLogin] = useState(initialLogin);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const modeLabel = useMemo(
    () => (mode === "login" ? "Login" : "Register"),
    [mode]
  );

  const handleSignupChange = async (event) => {
    const { name, value, files } = event.target;

    if (name === "companyImage" && files?.[0]) {
      const file = files[0];
      const dataUrl = await fileToBase64(file);
      setSignup((prev) => ({
        ...prev,
        companyImageName: file.name,
        companyImage: dataUrl
      }));
      return;
    }

    setSignup((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLogin((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await registerCompany(signup);
      setStatus({ type: "success", message: result.message });
      setSignup(initialSignup);
      setMode("login");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await loginCompany(login);
      setStatus({ type: "success", message: result.message });
      setLogin(initialLogin);
      onLoginSuccess(result.data);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <Logo />
          <p className="eyebrow">Finance Web</p>
          <h1>Company onboarding made simple.</h1>
          <p className="subtext">
            Register your company and start managing finances with clarity.
          </p>
        </div>
        <div className="toggle">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <h2>{modeLabel}</h2>
          <p className="card-subtext">
            {mode === "login"
              ? "Use your business registration number to sign in."
              : "Enter your company details to create an account."}
          </p>

          {status.message ? (
            <div className={`alert ${status.type}`}>{status.message}</div>
          ) : null}

          {mode === "register" ? (
            <RegisterForm
              values={signup}
              onChange={handleSignupChange}
              onSubmit={handleSignupSubmit}
              loading={loading}
            />
          ) : (
            <LoginForm
              values={login}
              onChange={handleLoginChange}
              onSubmit={handleLoginSubmit}
              loading={loading}
            />
          )}
        </section>

        <section className="side-card">
          <h3>What happens next</h3>
          <ul>
            <li>Register your company and store core profile info.</li>
            <li>Sign in using the business registration number.</li>
            <li>Connect to your finance workflow after onboarding.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
