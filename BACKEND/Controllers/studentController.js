const Student = require("../Model/studentModel");

// Get all students
const getAllStudents = async (req, res) => {
  try {
         const students = await Student.find();
         return res.status(200).json(students);
  } catch (err) {
                console.error("Error fetching students:", err);
                return res.status(500).json({ message: "Server error" });
  }
};

// Get one student
const getStudentById = async (req, res) => {
  try {
            const student = await Student.findById(req.params.id);
            if (!student) return res.status(404).json({ message: "Student not found" });
            return res.status(200).json(student);
  } catch (err) {
          console.error("Error fetching student:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create student
const addStudent = async (req, res) => {
  try {
    const userId = typeof req.body.userId === "string" ? req.body.userId.trim() : req.body.userId;
    const name = typeof req.body.name === "string" ? req.body.name.trim() : req.body.name;
    const route = typeof req.body.route === "string" ? req.body.route.trim() : req.body.route;
    const guardianName = typeof req.body.guardianName === "string" ? req.body.guardianName.trim() : req.body.guardianName;
    const parentContactNo = typeof req.body.parentContactNo === "string" ? req.body.parentContactNo.trim() : req.body.parentContactNo;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!name) return res.status(400).json({ message: "name is required" });
    if (!route) return res.status(400).json({ message: "route is required" });
    if (!guardianName) return res.status(400).json({ message: "guardianName is required" });
    if (!parentContactNo) return res.status(400).json({ message: "parentContactNo is required" });

    const exists = await Student.findOne({ userId });
    if (exists) return res.status(409).json({ message: "Student with this userId already exists" });

    const student = new Student({ userId,
                                    name, 
                                    route,
                                     guardianName,
                                      parentContactNo
                                     });
    const saved = await student.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating student:", err);
    if (err && err.code === 11000) return res.status(409).json({ message: "Student with this userId already exists" });
    if (err && err.name === "ValidationError") return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    ["userId", "name", "route", "guardianName", "parentContactNo"].forEach((k) => {
      if (typeof req.body[k] === "string") req.body[k] = req.body[k].trim();
    });

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating student:", err);
    if (err && err.code === 11000) return res.status(409).json({ message: "Student with this userId already exists" });
    if (err && err.name === "ValidationError") return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    return res.status(200).json({ message: "Student deleted" });
  } catch (err) {
    console.error("Error deleting student:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllStudents, 
                    getStudentById, 
                     addStudent,
                      updateStudent, 
                      deleteStudent 
                    };


