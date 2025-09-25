const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Middleware/auth");
const UserController = require("../Controllers/userControllers");

// Public stats route (accessible to all authenticated users)
router.get("/stats", verifyToken, UserController.getUserStats);

// Admin-only routes
router.get("/", verifyToken, verifyAdmin, UserController.getAllUsers);
router.post("/", verifyToken, verifyAdmin, UserController.createUser);
router.get("/:id", verifyToken, verifyAdmin, UserController.getById);
router.put("/:id", verifyToken, verifyAdmin, UserController.updateUser);
router.delete("/:id", verifyToken, verifyAdmin, UserController.deleteUser);

module.exports = router;
