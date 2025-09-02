// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../Model/userModel");

// Verify JWT token and attach user info to req.user
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // Expected format: "Bearer <token>"
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key"); // Replace with your secret
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to allow only Admin users
const verifyAdmin = async (req, res, next) => {
  try {
    // Make sure verifyToken ran first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user info found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // User is admin → proceed
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { verifyToken, verifyAdmin };
