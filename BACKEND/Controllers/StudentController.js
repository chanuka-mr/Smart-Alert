

const Student = require("../Model/StudentModel");  
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);


// Get all students from the database
const getAllStudents = async (req, res) => {
  try {
    
    const students = await Student.find().sort({ name: 1 });
    
   
    return res.status(200).json({ students });
  } catch (err) {
    
    console.error(err.message);
  return res.status(500).json({ message: "Server error" });
  }
};

// Add a new student to the database
const addStudent = async (req, res) => {
  
  const { name, std_index, section, parentName, parentPhoneNum } = req.body;

  
  if (!name || !std_index || !section || !parentName || !parentPhoneNum) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Create a new student instance with the provided data
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
    // Handle duplicate key error (when std_index already exists)
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this index number already exists" });
    }
   
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get a specific student by ID or index number
const getStudentByIdOrIndex = async (req, res) => {
  
  const param = req.params.id;
  
  try {
    let student;
    
    // Check if the parameter looks like a MongoDB ObjectId
    if (looksLikeObjectId(param)) {
      
      student = await Student.findById(param);
    } else {
      // Search by student index number
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

// Update an existing student's information
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

   
    const student = await Student.findByIdAndUpdate(id, update, { 
      new: true,           // Return the updated document
      runValidators: true  // Run schema validation
    });
    
    
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

// Delete a student from the database
const deleteStudent = async (req, res) => {
  // Get student ID from URL parameters
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
    
    // Return the deleted student data
    return res.status(200).json({ student });
  } catch (err) {
    // Log error and return server error
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