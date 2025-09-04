const express = require("express");
const router = express.Router();
const { login, verifyOtp } = require("../Controllers/authController");

// Login with password
router.post("/login", login);

// Verify OTP
router.post("/verify-otp", verifyOtp);

module.exports = router;
