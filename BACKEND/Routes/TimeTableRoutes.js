const express = require("express");
const router = express.Router();
const TimeTableController = require("../Controllers/TimeTableController");

router.get("/", TimeTableController.getAllTimeTables);
router.post("/", TimeTableController.addTimeTable);
router.get("/:id", TimeTableController.getById);
router.put("/:id", TimeTableController.updateTimeTable);
router.delete("/:id", TimeTableController.deleteTimeTable);

module.exports = router;
