const express = require("express");
const router = express.Router();
const ExamController = require("../Controllers/ExamController");

// Routes for fetching by student
router.get("/student/:studentId", ExamController.getByStudentId);
router.get("/report/:studentId", ExamController.downloadReport);
router.get("/progress/:studentId", ExamController.downloadProgressAnalysis);
router.get("/progress-analysis/:studentId", ExamController.getProgressAnalysis);

// CRUD routes
router.get("/", ExamController.getAllExams);
router.post("/", ExamController.addExam);
router.put("/:id", ExamController.updateExam);
router.delete("/:id", ExamController.deleteExam);
router.get("/:id", ExamController.getById);

module.exports = router;
