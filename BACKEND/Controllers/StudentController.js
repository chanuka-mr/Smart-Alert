const Student = require("../Model/StudentModel");
const mongoose = require("mongoose");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => {
    return typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);
};

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        return res.status(200).json({ students });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// Add student
const addStudent = async (req, res) => {
    const { name, std_index, section, parentName, parentPhoneNum } = req.body;

    if (!name || !std_index || !section || !parentName || !parentPhoneNum) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    try {
        const existing = await Student.findOne({ std_index });
        if (existing) return res.status(400).json({ message: "std_index already exists" });

        const student = new Student({ name, std_index, section, parentName, parentPhoneNum });
        await student.save();
        return res.status(200).json({ student });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get student by _id or std_index
const getStudentByIdOrIndex = async (req, res) => {
    const param = req.params.id;
    try {
        let student;
        if (looksLikeObjectId(param)) {
            student = await Student.findById(param);
        } else {
            student = await Student.findOne({ std_index: param });
        }
        if (!student) return res.status(404).json({ message: "Student not found" });
        return res.status(200).json({ student });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update student by _id or std_index
const updateStudent = async (req, res) => {
    const param = req.params.id;
    const { name, std_index, section, parentName, parentPhoneNum } = req.body;

    if (!name || !std_index || !section || !parentName || !parentPhoneNum) {
        return res.status(400).json({ message: "Please provide all fields to update" });
    }

    try {
        let student;
        if (looksLikeObjectId(param)) {
            student = await Student.findById(param);
        } else {
            student = await Student.findOne({ std_index: param });
        }

        if (!student) return res.status(404).json({ message: "Student not found" });

        // Check if std_index is used by another student
        const other = await Student.findOne({ std_index });
        if (other && other._id.toString() !== student._id.toString()) {
            return res.status(400).json({ message: "std_index already used by another student" });
        }

        // Update
        student.name = name;
        student.std_index = std_index;
        student.section = section;
        student.parentName = parentName;
        student.parentPhoneNum = parentPhoneNum;

        await student.save();
        return res.status(200).json({ student });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// Delete student by _id or std_index
const deleteStudent = async (req, res) => {
    const param = req.params.id;
    try {
        let student;
        if (looksLikeObjectId(param)) {
            student = await Student.findByIdAndDelete(param);
        } else {
            student = await Student.findOneAndDelete({ std_index: param });
        }
        if (!student) return res.status(404).json({ message: "Student not found" });
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