
import React, { useEffect, useRef, useState } from "react";
import "./OtpVerification.css";
import { post } from "../../utils/api";

export default function OtpVerification() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isExpired, setIsExpired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = useRef([]);

  // Get userID from localStorage (adjust if needed)
  const userID = localStorage.getItem("userID");

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle input
  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next
    if (index < 5 && value) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (paste.length === 6) {
      const newOtp = paste.split("");
      setOtp(newOtp);
      inputRefs.current[5].focus();
    }
  };


  // Submit OTP (call backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (isExpired) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    if (!userID) {
      setError("User ID not found. Please login again.");
      return;
    }
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setVerifying(true);
    try {
      await post("/auth/verify-otp", { userID, otp: enteredOtp });
      setSuccess("OTP Verified Successfully!");
      setError("");
    } catch (err) {
      setError(err.message || "Verification failed");
      setSuccess("");
    }
    setVerifying(false);
  };


  // Resend OTP (call backend)
  const handleResend = async () => {
    setError("");
    setSuccess("");
    if (!userID) {
      setError("User ID not found. Please login again.");
      return;
    }
    try {
      // Assuming backend triggers OTP resend on login endpoint
      await post("/auth/login", { userID });
      setOtp(new Array(6).fill(""));
      setTimeLeft(600);
      setIsExpired(false);
      inputRefs.current[0].focus();
      setSuccess("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    }
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="otp-container">
      <div className="otp-header">
        <h1>Smart Alert</h1>
        <p>OTP Verification</p>
      </div>

      <form className="otp-form" onSubmit={handleSubmit}>
        <div className="school-icon">
          <i className="fas fa-shield-alt"></i>
        </div>

        <div className="instruction">
          <p>We've sent a 6-digit verification code to your registered email</p>
          <p>Please enter it below to verify your identity</p>
        </div>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              className={`otp-input ${isExpired ? "error" : ""}`}
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={isExpired}
            />
          ))}
        </div>

        <div className={`timer ${isExpired ? "expired" : ""}`}>
          {isExpired ? (
            "OTP Expired"
          ) : (
            <>
              Resend OTP in: <span>{minutes}:{seconds}</span>
            </>
          )}
        </div>

        {error && (
          <div className="timeout-warning" style={{ color: "red" }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        {success && (
          <div className="timeout-warning" style={{ color: "green" }}>
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        <button
          type="submit"
          className="verify-button"
          disabled={otp.some((digit) => !digit) || isExpired || verifying}
        >
          {verifying ? <i className="fas fa-spinner fa-spin"></i> : "VERIFY OTP"}
        </button>

        <div className="resend-option">
          <div className="resend-text">Didn't receive the code?</div>
          <button
            type="button"
            className={`resend-link ${!isExpired ? "disabled" : ""}`}
            onClick={handleResend}
            disabled={!isExpired}
          >
            Resend OTP
          </button>
        </div>
      </form>
    </div>
  );
}
