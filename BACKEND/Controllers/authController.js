const User = require("../Model/userModel");
const jwt = require("jsonwebtoken");

// Login → get token
const login = async (req, res) => {
	const { std_index, password } = req.body;

	try {
		const user = await User.findOne({ std_index });
		if (!user) return res.status(401).json({ message: "Invalid credentials" });

		const isMatch = await user.comparePassword(password);
		if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

		// Generate JWT token (expires in 1h)
		const token = jwt.sign(
			{ id: user._id, role: user.role },
			"your_jwt_secret_key", // replace with .env secret in production
			{ expiresIn: "1h" }
		);

		res.status(200).json({ token });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Server error" });
	}
};

module.exports = { login };
