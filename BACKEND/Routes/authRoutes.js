const express = require("express");
const router = express.Router();
const { login, verifyOtp, setPassword } = require("../Controllers/authController");

// Step 1: Login
router.post("/login", login);

// Step 2: Verify OTP
router.post("/verify-otp", verifyOtp);

// Step 3: Set new password
router.post("/set-password", setPassword);

module.exports = router;
