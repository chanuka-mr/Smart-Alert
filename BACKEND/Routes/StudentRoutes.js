// ===========================================
// STUDENT ROUTES
// ===========================================
// This file defines all the API endpoints for student-related operations
// It maps HTTP requests to controller functions

const express = require("express");                    // Web framework for Node.js
const router = express.Router();                      // Create Express router instance
const StudentController = require("../Controllers/StudentController");  // Import student controller functions

// ===========================================
// ROUTE DEFINITIONS
// ===========================================
// Define all student-related API endpoints

// GET /students - Retrieve all students
router.get("/", StudentController.getAllStudents);

// POST /students - Create a new student
router.post("/", StudentController.addStudent);

// GET /students/:id - Get a specific student by ID or index number
router.get("/:id", StudentController.getStudentByIdOrIndex); 

// PUT /students/:id - Update a specific student's information
router.put("/:id", StudentController.updateStudent);

// DELETE /students/:id - Delete a specific student
router.delete("/:id", StudentController.deleteStudent);

// ===========================================
// MODULE EXPORTS
// ===========================================
// Export the router so it can be used in the main app.js file
module.exports = router;