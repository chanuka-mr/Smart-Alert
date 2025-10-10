const express = require("express");
const router = express.Router();
const TimeTableController = require("../Controllers/TimeTableController");

router.get("/", TimeTableController.getAllTimeTables);
router.get("/filtered", TimeTableController.getFilteredTimeTables);
router.post("/", TimeTableController.addTimeTable);
router.post("/migrate", TimeTableController.migrateTimeTableFields);
// Download filtered timetable PDF
router.get("/download/filtered", TimeTableController.downloadFilteredTimeTable);
// Download class-section-wise timetable PDF
router.get("/download/class-section/:classSection", TimeTableController.downloadTimeTableByClassSection);
// Download hall arrangement for a grade
router.get("/download/hall/:grade", TimeTableController.downloadHallArrangementByGrade);
router.get("/:id", TimeTableController.getById);
router.put("/:id", TimeTableController.updateTimeTable);
router.delete("/:id", TimeTableController.deleteTimeTable);

module.exports = router;
