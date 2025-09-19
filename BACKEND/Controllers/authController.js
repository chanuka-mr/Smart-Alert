const { User, Login } = require("../Model/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Configure mail transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "jayalathchanuka2003@gmail.com",
        pass: "cpze qnal ybej icgg"
    }
});

// Step 1: Login with userID and password
const login = async (req, res) => {
    const { userID, password } = req.body;

    try {
        const loginRecord = await Login.findOne({ userID });
        if (!loginRecord) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await loginRecord.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // If not verified → send OTP
        if (!loginRecord.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            loginRecord.otp = otp;
            loginRecord.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
            await loginRecord.save();

            const user = await User.findOne({ userID: loginRecord.userID });

            await transporter.sendMail({
                from: "jayalathchanuka2003@gmail.com",
                to: user.email,
                subject: "Your OTP Code",
                text: `Your OTP is: ${otp}. It expires in 10 minutes.`
            });

            console.log("Generated OTP:", otp); // log OTP for testing

            return res.status(200).json({
                message: "OTP sent to your email. Please verify.",
                otpRequired: true
            });
        }

        // If already verified → issue JWT
        const user = await User.findOne({ userID: loginRecord.userID });
        const token = jwt.sign(
            { id: loginRecord.userID, role: user.role },
            "your_jwt_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ token, otpRequired: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Step 2: Verify OTP
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

        const user = await User.findOne({ userID: loginRecord.userID });
        const token = jwt.sign(
            { id: loginRecord.userID, role: user.role },
            "your_jwt_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Verification successful", token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Step 3: Set new password after first login
const setPassword = async (req, res) => {
    const { userID, newPassword } = req.body;

    try {
        const loginRecord = await Login.findOne({ userID });
        if (!loginRecord) return res.status(404).json({ message: "User not found" });

        loginRecord.password = newPassword; // pre-save hook will hash
        loginRecord.isVerified = true;
        await loginRecord.save();

        const user = await User.findOne({ userID: loginRecord.userID });
        const token = jwt.sign(
            { id: loginRecord.userID, role: user.role },
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
