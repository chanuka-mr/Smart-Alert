const express = require("express");
const router = express.Router();
const ReportCardController = require("../Controllers/ReportCardController");

// Get all report cards
router.get("/", ReportCardController.getAllReportCards);

// Get filtered report cards by grade and class section
router.get("/filtered", ReportCardController.getFilteredReportCards);

// Get report card by student ID
router.get("/student/:studentId", ReportCardController.getReportCardByStudentId);

// Get student's rank in class
router.get("/rank/:studentId", ReportCardController.getStudentRank);

// Get progress analysis for a student
router.get("/progress-analysis/:studentId", ReportCardController.getProgressAnalysis);

// Get all students in a class with rankings
router.get("/class/:classLevel/rankings", ReportCardController.getClassRankings);

// Download report card PDF
router.get("/download/:studentId", ReportCardController.downloadReportCardPDF);

// Add new report card
router.post("/", ReportCardController.addReportCard);

// Update report card
router.put("/:id", ReportCardController.updateReportCard);

// Delete report card
router.delete("/:id", ReportCardController.deleteReportCard);

// Fix class sections for existing records
router.post("/fix-class-sections", ReportCardController.fixClassSections);

// Migrate existing report cards to create exam data for progress analysis
router.post("/migrate-to-exams", ReportCardController.migrateReportCardsToExams);

module.exports = router;
