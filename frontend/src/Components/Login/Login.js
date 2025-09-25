// src/Components/Login/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { api, setToken } from "../../utils/api"; // centralized helper (relative URLs via dev proxy)

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ userID: "", password: "" });
  const [errors, setErrors] = useState({ userID: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // "login" | "otp"
  const [step, setStep] = useState("login");
  const [info, setInfo] = useState("");
  const [otp, setOtp] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    // strip spaces (same behavior as your HTML)
    const cleaned = /\s/.test(value) ? value.replace(/\s/g, "") : value;
    setForm((f) => ({ ...f, [name]: cleaned }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const onKeyDownNoSpace = (e) => {
    if (e.key === " ") e.preventDefault();
  };

  const onPasteNoSpaces = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (/\s/.test(pasted)) {
      e.preventDefault();
      document.execCommand("insertText", false, pasted.replace(/\s/g, ""));
    }
  };

  const validate = () => {
    const next = { userID: "", password: "" };
    if (!form.userID.trim()) next.userID = "User ID cannot be empty or contain only spaces";
    if (!form.password.trim()) next.password = "Password cannot be empty or contain only spaces";
    setErrors(next);
    return !next.userID && !next.password;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setInfo("");
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: { userID: form.userID, password: form.password },
      });

      // remember last login id for any fallback logic
      try { localStorage.setItem("lastUserID", form.userID); } catch {}

      if (res?.otpRequired || res?.requiresOtp || res?.next === "otp") {
        setStep("otp");
        setInfo(res?.message || "OTP sent to your email. Please verify.");
      } else {
        const token =
          res?.token ||
          res?.accessToken ||
          res?.jwt ||
          (res?.data && (res.data.token || res.data.accessToken));
        if (token) setToken(token);
        navigate("/", { replace: true });
      }
    } catch (err) {
      setInfo(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!otp.trim()) return setInfo("Please enter the OTP sent to your email.");
    setLoading(true);
    setInfo("");
    try {
      const res = await api("/auth/verify-otp", {
        method: "POST",
        body: { userID: form.userID, otp },
      });
      const token =
        res?.token ||
        res?.accessToken ||
        res?.jwt ||
        (res?.data && (res.data.token || res.data.accessToken));
      if (token) setToken(token);
      setStep("login");
      setOtp("");
      navigate("/", { replace: true });
    } catch (err) {
      setInfo(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
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
              {/* User ID or Email */}
              <div className={`input-group ${errors.userID ? "has-error" : ""}`}>
                <input
                  type="text"
                  id="userid"
                  name="userID"
                  placeholder="User ID or Email"
                  value={form.userID}
                  onChange={onChange}
                  onKeyDown={onKeyDownNoSpace}
                  onPaste={onPasteNoSpaces}
                  autoComplete="username"
                  required
                />
                <label htmlFor="userid">User ID or Email</label>
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
                  onKeyDown={onKeyDownNoSpace}
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
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> AUTHENTICATING
                  </>
                ) : (
                  "LOGIN"
                )}
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
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> VERIFYING
                    </>
                  ) : (
                    "VERIFY OTP"
                  )}
                </button>
                <button type="button" className="link-btn" onClick={() => setStep("login")}>
                  ← Back to login
                </button>
              </div>
            </div>
          )}

          <div className="system-info">
            <p>{info || "Smart Alert v1.0 • Authorized Access Only"}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
