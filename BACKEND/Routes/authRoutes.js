// BACKEND/Routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { login, verifyOtp, setPassword, me, resetPassword, forgotPassword, resetPasswordViaEmail } = require("../Controllers/authController");
const { verifyToken } = require("../Middleware/auth"); // <-- import the middleware

// Auth flow
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", setPassword);

// Forgot password (public route)
router.post("/forgot-password", forgotPassword);

// Reset password via email token (public route)
router.post("/reset-password-via-email", resetPasswordViaEmail);

// Current user (protected)
router.get("/me", verifyToken, me);

// Password reset (protected)
router.post("/reset-password", verifyToken, resetPassword);

module.exports = router;
