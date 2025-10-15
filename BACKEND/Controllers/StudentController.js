const Student = require("../Model/studentModel");
const { User, Academic } = require("../Model/userModel");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);

// Get all students (from User collection with role="Parent" + Academic info)
const getAllStudents = async (req, res) => {
  try {
    // Get all users with role="Parent"
    const parents = await User.find({ role: "Parent" }).sort({ fullName: 1 });
    
    // Get academic info for each parent
    const studentsWithAcademic = await Promise.all(
      parents.map(async (parent) => {
        const academic = await Academic.findOne({ userID: parent.userID });
        
        return {
          _id: parent._id,
          userID: parent.userID,
          name: parent.fullName,
          std_index: parent.userID, // Using userID as student index
          section: academic ? `${academic.grade}${academic.class}` : null,
          grade: academic ? academic.grade : null,
          class: academic ? academic.class : null,
          email: parent.email,
          phone: parent.phone,
          birthday: parent.birthday,
          address: parent.address
        };
      })
    );
    
    // Filter out students without academic info (optional)
    const students = studentsWithAcademic.filter(s => s.section !== null);
    
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

// Get student by ID or index (robust lookup)
const getStudentByIdOrIndex = async (req, res) => {
  let param = req.params.id;
  if (typeof param === 'string') param = param.trim();

  try {
    // Try ObjectId first
    let student = null;
    if (looksLikeObjectId(param)) {
      student = await Student.findById(param);
    }

    // If not found, try case-insensitive full match on std_index
    if (!student && typeof param === 'string' && param.length > 0) {
      const safe = param.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      student = await Student.findOne({ std_index: { $regex: `^${safe}$`, $options: 'i' } });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ student });
  } catch (err) {
    console.error('Error in getStudentByIdOrIndex:', err);
    return res.status(500).json({ message: 'Server error' });
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
// Lookup a student/user by userID in the users collection (public minimal view)
const getStudentByUserId = async (req, res) => {
  try {
    let userid = req.params.userid;
    if (typeof userid === 'string') userid = userid.trim();

    if (!userid) return res.status(400).json({ message: 'Missing userid' });

    const safe = userid.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const user = await User.findOne({ userID: { $regex: `^${safe}$`, $options: 'i' } }).select('userID fullName');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error in getStudentByUserId:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStudents,
  addStudent,
  getStudentByIdOrIndex,
  getStudentByUserId,
  updateStudent,
  deleteStudent
};