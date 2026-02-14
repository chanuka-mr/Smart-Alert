const { User, Login } = require("../Model/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const activityController = require("./activityController");

// ====== Config (uses .env if available, but has safe fallbacks) ======
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const MAIL_USER = process.env.MAIL_USER || "jayalathchanuka2003@gmail.com";
const MAIL_PASS = process.env.MAIL_PASS || "cpze qnal ybej icgg";

// Create one transporter (reuse across requests)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

// Small helper to sign JWTs consistently
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Step 1: Login with userID/email and password
// POST /auth/login
const login = async (req, res) => {
  const { userID, password } = req.body;

  try {
    // First try to find by userID, then by email
    let loginRecord = await Login.findOne({ userID });
    
    // If not found by userID, try to find by email
    if (!loginRecord) {
      const user = await User.findOne({ email: userID });
      if (user) {
        loginRecord = await Login.findOne({ userID: user.userID });
      }
    }
    
    if (!loginRecord) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await loginRecord.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // If not verified → send OTP and require verification
    if (!loginRecord.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      loginRecord.otp = otp;
      loginRecord.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // FIX: Ensure username exists before saving, to backfill old records
      if (!loginRecord.username) {
        const user = await User.findOne({ userID: loginRecord.userID });
        if (user) {
          loginRecord.username = user.email;
        }
      }

      await loginRecord.save();

      const user = await User.findOne({ userID: loginRecord.userID });
      if (!user) {
        return res.status(404).json({ message: "User profile not found for OTP delivery" });
      }

      await transporter.sendMail({
        from: MAIL_USER,
        to: user.email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      });

      // For local testing, this is handy:
      console.log("Generated OTP for", userID, ":", otp);

      return res.status(200).json({
        message: "OTP sent to your email. Please verify.",
        otpRequired: true,
      });
    }

    // If already verified → issue JWT immediately
    const user = await User.findOne({ userID: loginRecord.userID }).lean();
    const token = signToken({ id: loginRecord.userID, role: user?.role });

    // Log login activity for admin users - not finished yet
    if (user?.role?.toLowerCase() === 'admin') {
      await activityController.logActivity(
        loginRecord.userID,
        user.fullName || user.name || 'Admin',
        'login',
        'system',
        null,
        null,
        `Admin logged in successfully`,
        { role: user.role, loginTime: new Date() },
        req
      );
    }

    return res.status(200).json({ token, otpRequired: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Step 2: Verify OTP
// POST /auth/verify-otp
const verifyOtp = async (req, res) => {
  const { userID, otp } = req.body;

  try {
    const loginRecord = await Login.findOne({ userID });
    if (!loginRecord) return res.status(404).json({ message: "User not found" });

    if (loginRecord.otp !== otp || loginRecord.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    loginRecord.isVerified = true;
    loginRecord.otp = undefined;
    loginRecord.otpExpiry = undefined;
    await loginRecord.save();

    const user = await User.findOne({ userID: loginRecord.userID }).lean();
    const token = signToken({ id: loginRecord.userID, role: user?.role });

    return res.status(200).json({ message: "Verification successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Step 3: Set new password after first login
// POST /auth/set-password
const setPassword = async (req, res) => {
  const { userID, newPassword } = req.body;

  try {
    const loginRecord = await Login.findOne({ userID });
    if (!loginRecord) return res.status(404).json({ message: "User not found" });

    loginRecord.password = newPassword; // pre-save hook on Login model should hash it
    loginRecord.isVerified = true;
    // Clear any leftover OTP fields
    loginRecord.otp = undefined;
    loginRecord.otpExpiry = undefined;

    await loginRecord.save();

    const user = await User.findOne({ userID: loginRecord.userID }).lean();
    const token = signToken({ id: loginRecord.userID, role: user?.role });

    return res.status(200).json({ message: "Password set successfully", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// NEW: Get current logged-in user's profile
// GET /auth/me
const me = async (req, res) => {
  try {
    // Extract & verify the JWT from Authorization header
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" "); // "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Missing token" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET); // { id: userID, role: ... }
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Load user profile & verification status
    const [user, loginRecord] = await Promise.all([
      User.findOne({ userID: payload.id }).lean(),
      Login.findOne({ userID: payload.id }).lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = {
      userID: user.userID,
      fullName: user.fullName || user.name,
      birthday: user.birthday || null,
      address: user.address || "",
      email: user.email || "",
      role: user.role || "User",
      createdAt: user.createdAt || null,
      isVerified: loginRecord?.isVerified ?? false,
    };

    return res.status(200).json({ user: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password (for logged-in users)
// POST /auth/reset-password
const resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Extract user ID from JWT token
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" "); // "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Missing token" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET); // { id: userID, role: ... }
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userID = payload.id;

    // Find the login record
    const loginRecord = await Login.findOne({ userID });
    if (!loginRecord) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isCurrentPasswordValid = await loginRecord.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    loginRecord.password = newPassword; // pre-save hook on Login model should hash it
    await loginRecord.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password (send reset link)
// POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  const { userIdentifier } = req.body;
  
  try {
    // Find user by userID or email
    const user = await User.findOne({
      $or: [
        { userID: userIdentifier },
        { email: userIdentifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.userID, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send email with reset link
    await transporter.sendMail({
      from: MAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - Smart Alert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00897b;">Smart Alert - Password Reset</h2>
          <p>Hello ${user.fullName || user.name || 'User'},</p>
          <p>You have requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(to right, #00897b 0%, #00bfa5 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Smart Alert System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    });
    
    // For local testing, log the reset link
    console.log('Password reset link for', user.userID, ':', resetLink);
    
    return res.status(200).json({ 
      message: 'Password reset link sent to your email address' 
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password via Email Token
// POST /auth/reset-password-via-email
const resetPasswordViaEmail = async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    // Verify the reset token
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Check if it's a password reset token
    if (payload.type !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    const userID = payload.id;
    
    // Find the login record
    const loginRecord = await Login.findOne({ userID });
    if (!loginRecord) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update password
    loginRecord.password = newPassword; // pre-save hook on Login model should hash it
    await loginRecord.save();
    
    return res.status(200).json({ message: 'Password reset successfully' });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, verifyOtp, setPassword, me, resetPassword, forgotPassword, resetPasswordViaEmail };
