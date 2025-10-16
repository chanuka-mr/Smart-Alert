const express = require("express");
const router = express.Router();
const AttendanceController = require("../Controllers/AttendanceController");
const { verifyToken } = require("../Middleware/auth");

router.get("/", AttendanceController.getAllAttendance);
router.post("/", AttendanceController.markAttendance);
router.get("/my-attendance", verifyToken, AttendanceController.getMyAttendance); 
router.get("/:studentId", AttendanceController.getAttendanceByStudent);
router.put("/:id", AttendanceController.updateAttendance);
router.delete("/:id", AttendanceController.deleteAttendance);
router.post("/notify-parents", AttendanceController.notifyParentsForAbsents);
module.exports = router;