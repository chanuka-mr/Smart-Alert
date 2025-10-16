const { User, Login } = require("../Model/userModel");
const { generateUserID } = require("../utils/userIDGenerator");
const activityController = require("./activityController");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    // Get email verification status for each user
    const usersWithVerification = await Promise.all(
      users.map(async (user) => {
        const login = await Login.findOne({ userID: user.userID });
        return {
          ...user.toObject(),
          isEmailVerified: login ? login.isVerified : false
        };
      })
    );

    return res.status(200).json({ users: usersWithVerification });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a new user (Admin only)
const createUser = async (req, res) => {
  const { fullName, birthday, address, email, role } = req.body;
  
  console.log('Creating user with data:', { fullName, birthday, address, email, role });
  console.log('Admin user:', req.user);

  try {
    // Generate automatic userID based on role
    const userID = await generateUserID(role);
    console.log('Generated userID:', userID);

    // Create User profile
    const user = new User({ userID, fullName, birthday, address, email, role });
    await user.save();
    console.log('User saved successfully:', user);

    // Create Login record (default password = email)
    const login = new Login({
      userID,
      username: email,
      password: email,
      isVerified: false
    });
    await login.save();
    console.log('Login record saved successfully');

    // Log activity - not finished yet
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';
    console.log('Logging activity for admin:', adminId, adminName);
    
    await activityController.logActivity(
      adminId,
      adminName,
      'user_created',
      'user',
      user._id.toString(),
      user.fullName,
      `Created new ${role} user: ${user.fullName} (${user.userID})`,
      { role, email: user.email },
      req
    );

    return res.status(201).json({ user, login });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(400).json({ message: "Unable to add user." });
  }
};

// Get user by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by MongoDB _id first, then by custom userID
    let user = await User.findById(id);
    if (!user) {
      user = await User.findOne({ userID: id });
    }
    
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user details
const updateUser = async (req, res) => {
  try {
    const updateData = req.body;
    const { id } = req.params;
    
    console.log('Updating user with ID:', id, 'Data:', updateData);
    
    // Try to find by MongoDB _id first, then by custom userID
    let user;
    
    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    }
    
    // If not found by _id or id is not a valid ObjectId, try by userID
    if (!user) {
      user = await User.findOneAndUpdate(
        { userID: id },
        updateData,
        { new: true }
      );
    }
    
    if (!user) return res.status(404).json({ message: "Unable to update user." });
    
    // Log activity - not finished yet
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';
    await activityController.logActivity(
      adminId,
      adminName,
      'user_updated',
      'user',
      user._id.toString(),
      user.fullName,
      `Updated ${user.role} user: ${user.fullName} (${user.userID})`,
      { role: user.role, email: user.email, changes: updateData },
      req
    );
    
    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by MongoDB _id first, then by custom userID
    let user = await User.findByIdAndDelete(id);
    if (!user) {
      user = await User.findOneAndDelete({ userID: id });
    }
    
    if (!user) return res.status(404).json({ message: "Unable to delete user." });

    // Also delete Login record
    await Login.deleteOne({ userID: user.userID });

    // Log activity - not finished yet
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';
    await activityController.logActivity(
      adminId,
      adminName,
      'user_deleted',
      'user',
      user._id.toString(),
      user.fullName,
      `Deleted ${user.role} user: ${user.fullName} (${user.userID})`,
      { role: user.role, email: user.email },
      req
    );

    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users count
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const parents = await User.countDocuments({ role: { $regex: /parent/i } });
    const teachers = await User.countDocuments({ role: { $regex: /teacher/i } });
    const shuttleStaff = await User.countDocuments({ role: { $regex: /shuttlestaff/i } });
    const admins = await User.countDocuments({ role: { $regex: /admin/i } });

    return res.status(200).json({
      totalUsers,
      parents,
      teachers,
      shuttleStaff,
      admins
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!role) {
      return res.status(400).json({ message: "Role parameter is required" });
    }

    const users = await User.find({ role: { $regex: new RegExp(role, 'i') } });
    
    if (!users || users.length === 0) {
      return res.status(404).json({ message: `No users found with role: ${role}` });
    }

    return res.status(200).json({ users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search user by userID
const searchByUserID = async (req, res) => {
  try {
    const { userID } = req.params;
    
    if (!userID) {
      return res.status(400).json({ message: "UserID parameter is required" });
    }

    const user = await User.findOne({ userID: userID });
    
    if (!user) {
      return res.status(404).json({ message: `User not found with ID: ${userID}` });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllUsers, createUser, getById, updateUser, deleteUser, getUserStats, getUsersByRole, searchByUserID };
