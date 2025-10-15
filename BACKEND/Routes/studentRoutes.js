const express = require("express");
const router = express.Router();
const StudentController = require("../Controllers/studentController");

router.get("/", StudentController.getAllStudents);
router.post("/", StudentController.addStudent);
// Debug route: lookup by std_index directly (case-insensitive)
router.get('/by-index/:index', async (req, res) => {
	req.params.id = req.params.index;
	return StudentController.getStudentByIdOrIndex(req, res);
});
// Public lookup by userID in users collection (case-insensitive)
router.get('/by-userid/:userid', async (req, res) => {
  return StudentController.getStudentByUserId(req, res);
});
router.get("/:id", StudentController.getStudentByIdOrIndex);
router.put("/:id", StudentController.updateStudent);
router.delete("/:id", StudentController.deleteStudent);

module.exports = router;