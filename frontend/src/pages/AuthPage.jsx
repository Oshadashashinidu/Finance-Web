import { useEffect, useMemo, useState } from "react";
import { loginCompany, registerCompany, requestPasswordReset, verifyResetCode, resetPassword } from "../api";
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
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const modeLabel = useMemo(
    () => (mode === "login" ? "Login" : "Register"),
    [mode]
  );

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [status.message]);

  useEffect(() => {
    if (status.message) {
      setStatus({ type: "", message: "" });
    }
  }, [mode]);

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

  const handlePasswordResetRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestPasswordReset({ companyEmail: resetEmail });
      setStatus({ type: "success", message: result.message });
      setResetStep("verify");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await verifyResetCode({ companyEmail: resetEmail, code: resetCode });
      setStatus({ type: "success", message: result.message });
      setResetStep("reset");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestPasswordReset({ companyEmail: resetEmail });
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    if (!newPassword || newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword({
        companyEmail: resetEmail,
        code: resetCode,
        password: newPassword
      });
      setStatus({ type: "success", message: result.message });
      setResetStep("request");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-visual" aria-hidden="true">
          <div className="auth-visual-content">
            <p className="auth-tagline">
              Global payments made simple — online payment solutions for you.
            </p>
            <h1>Manage your money</h1>
            <p className="auth-subtitle">
              Run your finance operations with a premium, unified dashboard.
            </p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <div className="auth-brand">
              <Logo />
              <span>FIMA</span>
            </div>
            <button
              className="auth-switch"
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </div>

          <div className="auth-panel-body">
            <h2>{mode === "login" ? "Sign In" : "Create account"}</h2>
            <p className="auth-panel-subtext">
              {mode === "login"
                ? "Use your business registration number to sign in."
                : "Enter your company details to create an account."}
            </p>

            {status.message ? (
              <div className={`alert ${status.type}`}>{status.message}</div>
            ) : null}

            <div className="auth-panel-scroll">
              {mode === "register" ? (
                <RegisterForm
                  values={signup}
                  onChange={handleSignupChange}
                  onSubmit={handleSignupSubmit}
                  loading={loading}
                />
              ) : mode === "forgot" ? (
                <form className="form" onSubmit={
                  resetStep === "request"
                    ? handlePasswordResetRequest
                    : resetStep === "verify"
                    ? handleVerifyCode
                    : handleResetPassword
                }>
                  {resetStep === "request" ? (
                    <>
                      <label>
                        Company email
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(event) => setResetEmail(event.target.value)}
                          required
                        />
                      </label>
                      <div className="form-actions">
                        <button className="ghost" type="button" onClick={() => setMode("login")}>
                          Back
                        </button>
                        <button className="primary" type="submit" disabled={loading}>
                          {loading ? "Sending..." : "Send verification code"}
                        </button>
                      </div>
                    </>
                  ) : resetStep === "verify" ? (
                    <>
                      <label>
                        Verification code
                        <input
                          value={resetCode}
                          onChange={(event) => setResetCode(event.target.value)}
                          required
                        />
                      </label>
                      <div className="form-actions">
                        <button className="ghost" type="button" onClick={() => setResetStep("request")}>
                          Back
                        </button>
                        <button className="ghost" type="button" onClick={handleResendCode} disabled={loading}>
                          {loading ? "Sending..." : "Resend code"}
                        </button>
                        <button className="primary" type="submit" disabled={loading}>
                          {loading ? "Verifying..." : "Verify code"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label>
                        New password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Confirm password
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          required
                        />
                      </label>
                      <div className="form-actions">
                        <button className="ghost" type="button" onClick={() => setResetStep("verify")}>
                          Back
                        </button>
                        <button className="primary" type="submit" disabled={loading}>
                          {loading ? "Saving..." : "Save password"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <>
                  <LoginForm
                    values={login}
                    onChange={handleLoginChange}
                    onSubmit={handleLoginSubmit}
                    loading={loading}
                  />
                  <button className="text-link" type="button" onClick={() => setMode("forgot")}>
                    Forgot password?
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
