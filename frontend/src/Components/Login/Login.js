import React, { useEffect, useState } from "react";
import "./Login.css";

/* ========= CONFIG =========
   1) Put REACT_APP_API_BASE in your frontend .env (e.g., http://localhost:5000)
   2) We include credentials: "include" because most auth APIs set HttpOnly cookies
*/
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

/* ========= helper: fetch with timeout + better errors ========= */
async function fetchJson(path, { method = "GET", body, headers, timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  let res, data;
  try {
    res = await fetch(`${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      credentials: "include", // important if backend sets cookies
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(t);
    // Classic “Failed to fetch” / CORS / network
    throw new Error(
      "Network error: Failed to reach API. Check that the backend is running, CORS is enabled, and REACT_APP_API_BASE is correct."
    );
  }

  clearTimeout(t);

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data ?? {};
}

function Login() {
  // form + ui
  const [form, setForm] = useState({ userID: "", password: "" });
  const [errors, setErrors] = useState({ userID: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // flow: login | otp | setpw
  const [step, setStep] = useState("login");
  const [info, setInfo] = useState("");

  // otp + set password
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState({ a: "", b: "" });
  const [savingPw, setSavingPw] = useState(false);

  // Health ping so you SEE if API is reachable (helps debug “Failed to fetch”)
  useEffect(() => {
    (async () => {
      try {
        await fetchJson("/"); // your backend root often returns a small message
        setInfo(""); // reachable
      } catch (e) {
        setInfo(
          `API not reachable at ${API_BASE}. Fix CORS / URL / server. (${e.message})`
        );
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    const cleaned = /\s/.test(value) ? value.replace(/\s/g, "") : value; // block spaces
    setForm((f) => ({ ...f, [name]: cleaned }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const onPasteNoSpaces = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (/\s/.test(pasted)) {
      e.preventDefault();
      const cleaned = pasted.replace(/\s/g, "");
      document.execCommand("insertText", false, cleaned);
    }
  };

  const validate = () => {
    const next = { userID: "", password: "" };
    if (!form.userID.trim()) next.userID = "User ID cannot be empty or contain only spaces";
    if (!form.password.trim()) next.password = "Password cannot be empty or contain only spaces";
    setErrors(next);
    return !next.userID && !next.password;
  };

  const saveTokenIfAny = (data) => {
    const token =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      (data?.data && (data.data.token || data.data.accessToken));
    if (token) {
      try { localStorage.setItem("token", token); } catch {}
    }
  };

  // ---- Login submit
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setInfo("");
    try {
      const res = await fetchJson("/auth/login", {
        method: "POST",
        body: { userID: form.userID, password: form.password },
      });

      if (res?.otpRequired || res?.requiresOtp || res?.next === "otp") {
        setStep("otp");
        setInfo(res?.message || "OTP sent to your email. Please verify.");
      } else {
        saveTokenIfAny(res);
        setInfo(res?.message || "Login successful!");
        // navigate('/dashboard') if you use react-router
      }
    } catch (err) {
      setInfo(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Verify OTP
  const onVerifyOtp = async () => {
    if (!otp.trim()) return setInfo("Please enter the OTP sent to your email.");
    setLoading(true);
    setInfo("");
    try {
      const res = await fetchJson("/auth/verify-otp", {
        method: "POST",
        body: { userID: form.userID, otp },
      });
      saveTokenIfAny(res);
      setInfo(res?.message || "OTP verified! You are now logged in.");
      setStep("login");
      setOtp("");
    } catch (err) {
      setInfo(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Set/Reset password (demo flow)
  const onSetPassword = async () => {
    if (!newPw.a || !newPw.b) return setInfo("Please fill both password fields.");
    if (newPw.a !== newPw.b) return setInfo("Passwords do not match.");

    setSavingPw(true);
    setInfo("");
    try {
      const res = await fetchJson("/auth/set-password", {
        method: "POST",
        body: { userID: form.userID, newPassword: newPw.a },
      });
      saveTokenIfAny(res);
      setInfo(res?.message || "Password set. You are now logged in.");
      setStep("login");
      setNewPw({ a: "", b: "" });
    } catch (err) {
      setInfo(err.message || "Failed to set password");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Smart Alert</h1>
          <p>School Management System</p>
        </div>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="school-icon">
            <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
          </div>

          {step === "login" && (
            <>
              {/* User ID */}
              <div className={`input-group ${errors.userID ? "has-error" : ""}`}>
                <input
                  type="text"
                  id="userid"
                  name="userID"
                  placeholder="User ID"
                  value={form.userID}
                  onChange={onChange}
                  onPaste={onPasteNoSpaces}
                  autoComplete="username"
                  required
                />
                <label htmlFor="userid">User ID</label>
                {errors.userID && <div className="error-message">{errors.userID}</div>}
              </div>

              {/* Password */}
              <div className={`input-group ${errors.password ? "has-error" : ""}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                  onPaste={onPasteNoSpaces}
                  autoComplete="current-password"
                  required
                />
                <label htmlFor="password">Password</label>

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`} aria-hidden="true"></i>
                </button>

                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <button
                type="button"
                className="forgot-password"
                onClick={() => setStep("setpw")}
                title="Set/Reset password"
              >
                Forgot Password?
              </button>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (<><i className="fa-solid fa-spinner fa-spin"></i> AUTHENTICATING</>) : ("LOGIN")}
              </button>
            </>
          )}

          {step === "otp" && (
            <div className="otp-panel">
              <p className="otp-info">{info || "OTP sent to your email. Enter it below:"}</p>
              <div className="input-group">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
                <label>One-Time Password (OTP)</label>
              </div>
              <div className="row">
                <button type="button" className="login-button" disabled={loading} onClick={onVerifyOtp}>
                  {loading ? (<><i className="fa-solid fa-spinner fa-spin"></i> VERIFYING</>) : ("VERIFY OTP")}
                </button>
                <button type="button" className="link-btn" onClick={() => setStep("login")}>← Back to login</button>
              </div>
            </div>
          )}

          {step === "setpw" && (
            <div className="otp-panel">
              <p className="otp-info">Set a new password for <b>{form.userID || "your account"}</b>.</p>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPw.a}
                  onChange={(e) => setNewPw((p) => ({ ...p, a: e.target.value }))}
                  required
                />
                <label>New Password</label>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={newPw.b}
                  onChange={(e) => setNewPw((p) => ({ ...p, b: e.target.value }))}
                  required
                />
                <label>Confirm New Password</label>
              </div>
              <div className="row">
                <button type="button" className="login-button" disabled={savingPw} onClick={onSetPassword}>
                  {savingPw ? (<><i className="fa-solid fa-spinner fa-spin"></i> SAVING</>) : ("SET PASSWORD")}
                </button>
                <button type="button" className="link-btn" onClick={() => setStep("login")}>← Back to login</button>
              </div>
            </div>
          )}

          <div className="system-info">
            <p>{info || `EduManage School System v4.1 • Authorized Access Only • API ${API_BASE}`}</p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* You asked for no export.
   If you need to import this component elsewhere later, add:
   export default Login;
*/
export default Login;