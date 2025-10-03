const express = require("express");
const router = express.Router();
const locationController = require("../Controllers/locationController");

// Shuttle location routes
router.get("/shuttle/:shuttleId", locationController.getShuttleLocation);
router.get("/shuttle/:shuttleId/history", locationController.getShuttleLocationHistory);
router.post("/shuttle/:shuttleId", locationController.updateShuttleLocation);

// Student location routes
router.get("/student/:studentId", locationController.getStudentLocation);
router.post("/student/:studentId", locationController.updateStudentLocation);

// General location routes
router.get("/active", locationController.getAllActiveLocations);

module.exports = router;
