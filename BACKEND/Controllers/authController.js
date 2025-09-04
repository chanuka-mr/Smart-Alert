const User = require("../Model/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ✅ Configure mail transport (use your Gmail / SMTP settings)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "jayalathchanuka2003@gmail.com", // email
        pass: "cpze qnal ybej icgg"    // app password for Gmail
    }
});

// Login → step 1: Check password & handle OTP
const login = async (req, res) => {
    const { std_index, password } = req.body;

    try {
        const user = await User.findOne({ std_index });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // ✅ If not verified → send OTP
        if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
            user.otp = otp;
            user.otpExpiry = Date.now() + 10 * 60 * 1000; // valid for 10 min
            await user.save();

            // Send OTP email
            await transporter.sendMail({
                from: "jayalathchanuka2003@gmail.com",
                to: user.email,
                subject: "Your OTP Code",
                text: `Your OTP is: ${otp}. It expires in 10 minutes.`
            });

            return res.status(200).json({
                message: "OTP sent to your email. Please verify to complete login.",
                otpRequired: true
            });
        }

        // ✅ If already verified → issue JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            "your_jwt_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ token, otpRequired: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

// OTP Verification → step 2
const verifyOtp = async (req, res) => {
    const { std_index, otp } = req.body;

    try {
        const user = await User.findOne({ std_index });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // ✅ Mark user verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // ✅ Issue JWT after verification
        const token = jwt.sign(
            { id: user._id, role: user.role },
            "your_jwt_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Verification successful", token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

const setPassword = async (req, res) => {
    const { std_index, newPassword } = req.body;

    try {
        const user = await User.findOne({ std_index });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Hash and update password
        user.password = newPassword; // will be hashed by pre-save hook
        user.isVerified = true;      // first-time verification complete
        await user.save();

        // Issue JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            "your_jwt_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Password set successfully", token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { login, verifyOtp, setPassword };
