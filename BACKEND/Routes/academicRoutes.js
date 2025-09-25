const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Middleware/auth");
const AcademicController = require("../Controllers/academicController");

// Public routes (accessible to all authenticated users)
router.get("/", verifyToken, AcademicController.getAllAcademicRecords);
router.get("/stats", verifyToken, AcademicController.getAcademicStats);
router.get("/unassigned", verifyToken, AcademicController.getUsersWithoutAcademicInfo);
router.get("/:userID", verifyToken, AcademicController.getAcademicRecord);

// Admin-only routes
router.post("/assign", verifyToken, verifyAdmin, AcademicController.assignAcademicInfo);
router.put("/:userID", verifyToken, verifyAdmin, AcademicController.updateAcademicInfo);
router.delete("/:userID", verifyToken, verifyAdmin, AcademicController.removeAcademicInfo);

module.exports = router;
