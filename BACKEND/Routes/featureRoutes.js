const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Middleware/auth");
const FeatureController = require("../Controllers/featureController");

// Public routes (accessible to all authenticated users)
router.get("/", verifyToken, FeatureController.getAllFeatures);
router.get("/:id", verifyToken, FeatureController.getFeatureById);

// Admin-only routes
router.post("/", verifyToken, verifyAdmin, FeatureController.createFeature);
router.put("/:id", verifyToken, verifyAdmin, FeatureController.updateFeature);
router.delete("/:id", verifyToken, verifyAdmin, FeatureController.deleteFeature);

module.exports = router;

