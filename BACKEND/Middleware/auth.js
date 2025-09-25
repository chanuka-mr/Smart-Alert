// BACKEND/Middleware/auth.js
const jwt = require("jsonwebtoken");
const { User } = require("../Model/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

function getTokenFromRequest(req) {
  // Authorization: Bearer <token>
  const auth = req.headers.authorization || req.headers.Authorization || "";
  if (typeof auth === "string") {
    const [scheme, token] = auth.split(" ");
    if (/^Bearer$/i.test(scheme) && token) return token;
  }
  // Cookie (requires cookie-parser middleware to be used in app.js)
  if (req.cookies && req.cookies.token) return req.cookies.token;
  // Optional: token in query for testing
  if (req.query && req.query.token) return req.query.token;
  return null;
}

// Verify JWT token
function verifyToken(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET); // e.g. { id, role, iat, exp }
    req.user = payload;
    req.token = token;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Allow only Admins
async function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Fast-path: trust token role if present and Admin
  if (req.user.role === "Admin") return next();

  try {
    const user = await User.findOne({ userID: req.user.id }).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized: user not found" });
    if (user.role !== "Admin") return res.status(403).json({ message: "Forbidden: Admins only" });
    return next();
  } catch (err) {
    console.error("verifyAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { verifyToken, verifyAdmin };
