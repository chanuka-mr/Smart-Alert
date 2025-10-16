const Student = require("../Model/studentModel");
const { User, Academic } = require("../Model/userModel");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);

// Get all students (from User collection with role="Parent" + Academic info)
const getAllStudents = async (req, res) => {
  try {
    // Get all users with role="Parent"
    const parents = await User.find({ role: "Parent" }).sort({ fullName: 1 });
    
    // Get academic info and route for each parent
    const studentsWithAcademic = await Promise.all(
      parents.map(async (parent) => {
        const academic = await Academic.findOne({ userID: parent.userID });
        const studentRecord = await Student.findOne({ std_index: parent.userID });
        
        return {
          _id: parent._id,
          userId: parent.userID, // Match frontend field name
          userID: parent.userID,
          name: parent.fullName,
          route: studentRecord?.section || 'N/A', // Get route from Student record
          guardianName: studentRecord?.parentName || parent.address || 'N/A',
          parentContactNo: studentRecord?.parentPhoneNum || parent.phone || 'N/A',
          std_index: parent.userID, // Using userID as student index
          section: academic ? `${academic.grade}${academic.class}` : 'N/A',
          grade: academic ? academic.grade : null,
          class: academic ? academic.class : null,
          email: parent.email,
          birthday: parent.birthday
        };
      })
    );
    
    // Return all students (don't filter out those without academic info)
    return res.status(200).json({ students: studentsWithAcademic });
  } catch (err) {
    console.error('Get all students error:', err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add a new student (creates User with role="Parent" + Academic record)
const addStudent = async (req, res) => {
  const { userId, name, route, guardianName, parentContactNo } = req.body;

  if (!userId || !name || !route || !guardianName || !parentContactNo) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ userID: userId });
    if (existingUser) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }

    // Create new user with role="Parent"
    // Calculate a valid birthday (10 years old from today)
    const today = new Date();
    const defaultBirthday = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    
    const newUser = new User({
      userID: userId,
      fullName: name,
      role: "Parent",
      email: `${userId}@student.edu`, // Generate email from userID
      phone: parentContactNo,
      address: guardianName, // Store guardian name in address field temporarily
      birthday: defaultBirthday // Default birthday (10 years old, valid for Parent role)
    });

    await newUser.save();

    // Create Academic record if route contains grade info
    // Extract grade from route if possible (e.g., "Grade 10 - Route A" -> grade: 10)
    const gradeMatch = route.match(/Grade\s*(\d+)/i) || route.match(/(\d+)/);
    if (gradeMatch) {
      const academic = new Academic({
        userID: userId,
        grade: parseInt(gradeMatch[1]),
        class: route.includes('A') ? 'A' : route.includes('B') ? 'B' : 'C'
      });
      await academic.save();
    }

    // Create Student record to store route assignment
    const studentRecord = new Student({
      name: name,
      std_index: userId,
      section: route, // Store route in section field
      parentName: guardianName,
      parentPhoneNum: parentContactNo
    });
    await studentRecord.save();

    return res.status(201).json({ 
      message: "Student registered successfully",
      student: {
        _id: newUser._id,
        userID: newUser.userID,
        name: newUser.fullName,
        route: route,
        guardianName: guardianName,
        parentContactNo: parentContactNo
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }
    console.error('Add student error:', err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
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

// Update student (updates User with role="Parent" + Academic record)
const updateStudent = async (req, res) => {
  const id = req.params.id;
  const { userId, name, route, guardianName, parentContactNo } = req.body;

  try {
    // Find the user to update
    let user;
    if (looksLikeObjectId(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ userID: id });
    }
    
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update User fields
    if (name) user.fullName = name;
    if (userId && userId !== user.userID) user.userID = userId;
    if (guardianName) user.address = guardianName;
    if (parentContactNo) user.phone = parentContactNo;

    await user.save();

    // Update Academic record if route contains grade info
    if (route) {
      const gradeMatch = route.match(/Grade\s*(\d+)/i) || route.match(/(\d+)/);
      if (gradeMatch) {
        const academic = await Academic.findOne({ userID: user.userID });
        if (academic) {
          academic.grade = parseInt(gradeMatch[1]);
          academic.class = route.includes('A') ? 'A' : route.includes('B') ? 'B' : 'C';
          await academic.save();
        } else {
          // Create new academic record if it doesn't exist
          const newAcademic = new Academic({
            userID: user.userID,
            grade: parseInt(gradeMatch[1]),
            class: route.includes('A') ? 'A' : route.includes('B') ? 'B' : 'C'
          });
          await newAcademic.save();
        }
      }
    }

    // Update Student record to store route assignment
    const studentRecord = await Student.findOne({ std_index: user.userID });
    if (studentRecord) {
      if (name) studentRecord.name = name;
      if (route) studentRecord.section = route;
      if (guardianName) studentRecord.parentName = guardianName;
      if (parentContactNo) studentRecord.parentPhoneNum = parentContactNo;
      await studentRecord.save();
    } else {
      // Create new student record if it doesn't exist
      const newStudentRecord = new Student({
        name: user.fullName,
        std_index: user.userID,
        section: route || 'N/A',
        parentName: guardianName || user.address,
        parentPhoneNum: parentContactNo || user.phone
      });
      await newStudentRecord.save();
    }
    
    return res.status(200).json({ 
      message: "Student updated successfully",
      student: {
        _id: user._id,
        userId: user.userID,
        name: user.fullName,
        route: route || 'N/A',
        guardianName: user.address,
        parentContactNo: user.phone
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }
    console.error('Update student error:', err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Delete student (from User collection with role="Parent")
const deleteStudent = async (req, res) => {
  const id = req.params.id;
  
  try {
    let deletedUser;
    
    // Try to delete by MongoDB _id first (from User collection)
    if (looksLikeObjectId(id)) {
      deletedUser = await User.findByIdAndDelete(id);
    }
    
    // If not found, try by userID
    if (!deletedUser) {
      deletedUser = await User.findOneAndDelete({ userID: id });
    }
    
    // If found in User collection, also delete associated Academic record
    if (deletedUser) {
      await Academic.deleteOne({ userID: deletedUser.userID });
      return res.status(200).json({ 
        message: "Student deleted successfully", 
        student: deletedUser 
      });
    }
    
    // Fallback: Try Student collection (for backward compatibility)
    let student;
    if (looksLikeObjectId(id)) {
      student = await Student.findByIdAndDelete(id);
    }
    if (!student) {
      student = await Student.findOneAndDelete({ std_index: id });
    }
    if (!student) {
      student = await Student.findOneAndDelete({ userId: id });
    }
    
    if (student) {
      return res.status(200).json({ 
        message: "Student deleted successfully", 
        student 
      });
    }
    
    // Not found in either collection
    return res.status(404).json({ message: "Student not found" });
  } catch (err) {
    console.error('Delete student error:', err.message);
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