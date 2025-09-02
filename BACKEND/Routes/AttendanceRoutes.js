const express = require("express");
const router = express.Router();
const AttendanceController = require("../Controllers/AttendanceController");

router.get("/", AttendanceController.getAllAttendance);
router.post("/", AttendanceController.markAttendance);
router.get("/:studentId", AttendanceController.getAttendanceByStudent);
router.put("/:id", AttendanceController.updateAttendance);
router.delete("/:id", AttendanceController.deleteAttendance);

module.exports = router;