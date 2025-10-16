const { User, Academic, Parent } = require("../Model/userModel");

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

// Add a new student (creates User with role=Parent, Academic, and Parent records)
const addStudent = async (req, res) => {
  const { userID, fullName, email, birthday, address, phone, grade, classSection, parentName, parentPhoneNum } = req.body;

  if (!userID || !fullName || !email || !birthday || !address || !grade || !classSection || !parentName || !parentPhoneNum) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Create User with role=Parent
    const user = new User({
      userID,
      fullName,
      email,
      birthday,
      address,
      phone,
      role: "Parent"
    });
    await user.save();

    // Create Academic record
    const academic = new Academic({
      userID,
      grade,
      class: classSection,
      assignedBy: "system" // You may want to pass the actual admin userID
    });
    await academic.save();

    // Create Parent details
    const parentDetails = new Parent({
      userID,
      parentName,
      contactNumber: parentPhoneNum,
      whatsappNumber: parentPhoneNum
    });
    await parentDetails.save();

    // Return formatted student data
    const student = {
      _id: user._id,
      userID: user.userID,
      name: user.fullName,
      std_index: user.userID,
      section: `${grade}${classSection}`,
      grade,
      class: classSection,
      email: user.email,
      phone: user.phone,
      birthday: user.birthday,
      address: user.address,
      parentName,
      parentPhoneNum
    };

    return res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get student by ID or userID (robust lookup)
const getStudentByIdOrIndex = async (req, res) => {
  let param = req.params.id;
  if (typeof param === 'string') param = param.trim();

  try {
    // Try ObjectId first
    let user = null;
    if (looksLikeObjectId(param)) {
      user = await User.findOne({ _id: param, role: "Parent" });
    }

    // If not found, try case-insensitive full match on userID
    if (!user && typeof param === 'string' && param.length > 0) {
      const safe = param.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      user = await User.findOne({ userID: { $regex: `^${safe}$`, $options: 'i' }, role: "Parent" });
    }

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get academic info
    const academic = await Academic.findOne({ userID: user.userID });
    const parentDetails = await Parent.findOne({ userID: user.userID });

    const student = {
      _id: user._id,
      userID: user.userID,
      name: user.fullName,
      std_index: user.userID,
      section: academic ? `${academic.grade}${academic.class}` : null,
      grade: academic ? academic.grade : null,
      class: academic ? academic.class : null,
      email: user.email,
      phone: user.phone,
      birthday: user.birthday,
      address: user.address,
      parentName: parentDetails?.parentName,
      parentPhoneNum: parentDetails?.whatsappNumber
    };

    return res.status(200).json({ student });
  } catch (err) {
    console.error('Error in getStudentByIdOrIndex:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update student (updates User, Academic, and Parent records)
const updateStudent = async (req, res) => {
  const id = req.params.id;
  const { fullName, email, birthday, address, phone, grade, classSection, parentName, parentPhoneNum } = req.body;

  try {
    // Find user
    const user = await User.findOne({ _id: id, role: "Parent" });
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update User
    const userUpdate = {};
    if (fullName) userUpdate.fullName = fullName;
    if (email) userUpdate.email = email;
    if (birthday) userUpdate.birthday = birthday;
    if (address) userUpdate.address = address;
    if (phone) userUpdate.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(id, userUpdate, { new: true, runValidators: true });

    // Update Academic if grade or class provided
    if (grade || classSection) {
      const academicUpdate = {};
      if (grade) academicUpdate.grade = grade;
      if (classSection) academicUpdate.class = classSection;
      await Academic.findOneAndUpdate({ userID: user.userID }, academicUpdate, { new: true, runValidators: true });
    }

    // Update Parent details if provided
    if (parentName || parentPhoneNum) {
      const parentUpdate = {};
      if (parentName) parentUpdate.parentName = parentName;
      if (parentPhoneNum) {
        parentUpdate.contactNumber = parentPhoneNum;
        parentUpdate.whatsappNumber = parentPhoneNum;
      }
      await Parent.findOneAndUpdate({ userID: user.userID }, parentUpdate, { new: true, runValidators: true });
    }

    // Get updated data
    const academic = await Academic.findOne({ userID: user.userID });
    const parentDetails = await Parent.findOne({ userID: user.userID });

    const student = {
      _id: updatedUser._id,
      userID: updatedUser.userID,
      name: updatedUser.fullName,
      std_index: updatedUser.userID,
      section: academic ? `${academic.grade}${academic.class}` : null,
      grade: academic ? academic.grade : null,
      class: academic ? academic.class : null,
      email: updatedUser.email,
      phone: updatedUser.phone,
      birthday: updatedUser.birthday,
      address: updatedUser.address,
      parentName: parentDetails?.parentName,
      parentPhoneNum: parentDetails?.whatsappNumber
    };
    
    return res.status(200).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete student (deletes User, Academic, and Parent records)
const deleteStudent = async (req, res) => {
  const id = req.params.id;
  
  try {
    let user;
    if (looksLikeObjectId(id)) {
      user = await User.findOne({ _id: id, role: "Parent" });
    } else {
      user = await User.findOne({ userID: id, role: "Parent" });
    }
    
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete related records
    await Academic.findOneAndDelete({ userID: user.userID });
    await Parent.findOneAndDelete({ userID: user.userID });
    await User.findByIdAndDelete(user._id);
    
    const student = {
      _id: user._id,
      userID: user.userID,
      name: user.fullName,
      std_index: user.userID
    };
    
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