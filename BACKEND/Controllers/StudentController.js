const Student = require("../Model/StudentModel");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    return res.status(200).json({ students });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add a new student
const addStudent = async (req, res) => {
  const { name, std_index, section, parentName, parentPhoneNum } = req.body;

  if (!name || !std_index || !section || !parentName || !parentPhoneNum) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const student = new Student({
      name,
      std_index,
      section,
      parentName,
      parentPhoneNum
    });

    await student.save();
    return res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this index number already exists" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get student by ID or index
const getStudentByIdOrIndex = async (req, res) => {
  const param = req.params.id;
  
  try {
    let student;
    if (looksLikeObjectId(param)) {
      student = await Student.findById(param);
    } else {
      student = await Student.findOne({ std_index: param });
    }
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    return res.status(200).json({ student });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update student
const updateStudent = async (req, res) => {
  const id = req.params.id;
  const { name, std_index, section, parentName, parentPhoneNum } = req.body;

  try {
    const update = {};
    if (name) update.name = name;
    if (std_index) update.std_index = std_index;
    if (section) update.section = section;
    if (parentName) update.parentName = parentName;
    if (parentPhoneNum) update.parentPhoneNum = parentPhoneNum;

    const student = await Student.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    return res.status(200).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this index number already exists" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  const id = req.params.id;
  
  try {
    let student;
    if (looksLikeObjectId(id)) {
      student = await Student.findByIdAndDelete(id);
    } else {
      student = await Student.findOneAndDelete({ std_index: id });
    }
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    return res.status(200).json({ student });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  getStudentByIdOrIndex,
  updateStudent,
  deleteStudent
};