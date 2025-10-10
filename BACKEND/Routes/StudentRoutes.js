const express = require("express");
const router = express.Router();
const StudentController = require("../Controllers/StudentController");

router.get("/", StudentController.getAllStudents);
router.post("/", StudentController.addStudent);
router.get("/:id", StudentController.getStudentByIdOrIndex); 
router.put("/:id", StudentController.updateStudent);
router.delete("/:id", StudentController.deleteStudent);

module.exports = router;