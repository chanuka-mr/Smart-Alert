const express = require("express");
const router = express.Router();
const ExamController = require("../Controllers/ExamController");

// Routes for fetching by student
router.get("/student/:studentId", ExamController.getByStudentId);
router.get("/report/:studentId", ExamController.downloadReport);

// CRUD routes
router.get("/", ExamController.getAllExams);
router.post("/", ExamController.addExam);
router.put("/:id", ExamController.updateExam);
router.delete("/:id", ExamController.deleteExam);
router.get("/:id", ExamController.getById);

module.exports = router;
