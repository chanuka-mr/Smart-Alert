const { Academic, User } = require("../Model/userModel");

// Get all academic records
const getAllAcademicRecords = async (req, res) => {
  try {
    const { grade, class: classFilter, role } = req.query;
    
    let filter = {};
    if (grade) filter.grade = parseInt(grade);
    if (classFilter) filter.class = classFilter.toUpperCase();

    const academicRecords = await Academic.find(filter)
      .sort({ grade: 1, class: 1, userID: 1 });

    // Manually populate user data since userID is a string, not ObjectId
    const populatedRecords = await Promise.all(
      academicRecords.map(async (record) => {
        const user = await User.findOne({ userID: record.userID }).select('fullName email role');
        const assignedByUser = await User.findOne({ userID: record.assignedBy }).select('fullName');

        // Always preserve the original userID string in the response so the frontend can
        // map academic records to users even when the User document is missing.
        const originalUserID = record.userID;

        return {
          ...record.toObject(),
          originalUserID,
          userID: user ? {
            userID: user.userID,
            fullName: user.fullName,
            email: user.email,
            role: user.role
          } : { userID: originalUserID, fullName: null, email: null, role: null },
          assignedBy: assignedByUser ? {
            userID: assignedByUser.userID,
            fullName: assignedByUser.fullName
          } : null
        };
      })
    );

    // Filter by role if specified
    let filteredRecords = populatedRecords;
    if (role) {
      filteredRecords = populatedRecords.filter(record => 
        record.userID && record.userID.role && 
        record.userID.role.toLowerCase() === role.toLowerCase()
      );
    }

    return res.status(200).json({ academicRecords: filteredRecords });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get academic record by userID
const getAcademicRecord = async (req, res) => {
  try {
    const { userID } = req.params;
    
    const academicRecord = await Academic.findOne({ userID });

    if (!academicRecord) {
      return res.status(404).json({ message: "Academic record not found" });
    }

    // Manually populate user data
    const user = await User.findOne({ userID: academicRecord.userID }).select('fullName email role');
    const assignedByUser = await User.findOne({ userID: academicRecord.assignedBy }).select('fullName');
    
    const originalUserID = academicRecord.userID;
    const populatedRecord = {
      ...academicRecord.toObject(),
      originalUserID,
      userID: user ? {
        userID: user.userID,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      } : { userID: originalUserID, fullName: null, email: null, role: null },
      assignedBy: assignedByUser ? {
        userID: assignedByUser.userID,
        fullName: assignedByUser.fullName
      } : null
    };

    return res.status(200).json({ academicRecord: populatedRecord });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign academic information to a user (Admin only)
const assignAcademicInfo = async (req, res) => {
  try {
    const { userID, grade, class: classValue } = req.body;
    const assignedBy = req.user.id; // Admin who is assigning

    console.log('Assigning academic info:', { userID, grade, class: classValue, assignedBy });

    // Check if user exists
    const user = await User.findOne({ userID });
    if (!user) {
      console.log('User not found:', userID);
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is parent or teacher
    if (user.role !== 'Parent' && user.role !== 'Teacher') {
      return res.status(400).json({ 
        message: "Academic information can only be assigned to Parent or Teacher roles" 
      });
    }

    // Check if academic record already exists
    const existingRecord = await Academic.findOne({ userID });
    if (existingRecord) {
      console.log('Academic record already exists for user:', userID);
      return res.status(400).json({ 
        message: "Academic information already assigned to this user" 
      });
    }

    const academicRecord = new Academic({
      userID,
      grade,
      class: classValue,
      assignedBy
    });

    console.log('Creating academic record:', academicRecord);
    await academicRecord.save();
    console.log('Academic record saved successfully:', academicRecord);

    return res.status(201).json({ 
      message: "Academic information assigned successfully", 
      academicRecord 
    });
  } catch (err) {
    console.error('Error assigning academic info:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update academic information (Admin only)
const updateAcademicInfo = async (req, res) => {
  try {
    const { userID } = req.params;
    const { grade, class: classValue } = req.body;

    const academicRecord = await Academic.findOneAndUpdate(
      { userID },
      { grade, class: classValue },
      { new: true, runValidators: true }
    );

    if (!academicRecord) {
      return res.status(404).json({ message: "Academic record not found" });
    }

    return res.status(200).json({ 
      message: "Academic information updated successfully", 
      academicRecord 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove academic information (Admin only)
const removeAcademicInfo = async (req, res) => {
  try {
    const { userID } = req.params;

    const academicRecord = await Academic.findOneAndDelete({ userID });

    if (!academicRecord) {
      return res.status(404).json({ message: "Academic record not found" });
    }

    return res.status(200).json({ 
      message: "Academic information removed successfully", 
      academicRecord 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users without academic information (for admin to assign)
const getUsersWithoutAcademicInfo = async (req, res) => {
  try {
    const { role } = req.query;
    
    // Get all users with Parent or Teacher role
    let userFilter = { role: { $in: ['Parent', 'Teacher'] } };
    if (role) {
      userFilter.role = role;
    }

    const users = await User.find(userFilter).select('userID fullName email role');
    
    // Get users who already have academic information
    const academicUserIDs = await Academic.find({}).select('userID');
    const assignedUserIDs = academicUserIDs.map(record => record.userID);
    
    // Filter out users who already have academic information
    const usersWithoutAcademic = users.filter(user => 
      !assignedUserIDs.includes(user.userID)
    );

    return res.status(200).json({ 
      users: usersWithoutAcademic,
      count: usersWithoutAcademic.length 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get academic statistics
const getAcademicStats = async (req, res) => {
  try {
    const stats = await Academic.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: 'userID',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          byRole: {
            $push: {
              role: '$user.role',
              grade: '$grade',
              class: '$class'
            }
          }
        }
      }
    ]);

    // Get grade distribution
    const gradeStats = await Academic.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: 'userID',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: { grade: '$grade', class: '$class' },
          count: { $sum: 1 },
          roles: { $addToSet: '$user.role' }
        }
      },
      { $sort: { '_id.grade': 1, '_id.class': 1 } }
    ]);

    return res.status(200).json({ 
      stats: stats[0] || { totalAssigned: 0, byRole: [] },
      gradeStats 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllAcademicRecords,
  getAcademicRecord,
  assignAcademicInfo,
  updateAcademicInfo,
  removeAcademicInfo,
  getUsersWithoutAcademicInfo,
  getAcademicStats
};
