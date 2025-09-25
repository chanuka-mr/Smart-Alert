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

  try {
    // Generate automatic userID based on role
    const userID = await generateUserID(role);

    // Create User profile
    const user = new User({ userID, fullName, birthday, address, email, role });
    await user.save();

    // Create Login record (default password = email)
    const login = new Login({
      userID,
      username: email,
      password: email, // pre-save hook will hash
      isVerified: false
    });
    await login.save();

    // Log activity
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';
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
    console.log(err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(400).json({ message: "Unable to add user." });
  }
};

// Get user by MongoDB ID
const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
    const { fullName, birthday, address, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, birthday, address, email, role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Unable to update user." });
    
    // Log activity
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
      { role: user.role, email: user.email, changes: { fullName, birthday, address, email, role } },
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
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Unable to delete user." });

    // Also delete Login record
    await Login.deleteOne({ userID: user.userID });

    // Log activity
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

// Get user statistics
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

module.exports = { getAllUsers, createUser, getById, updateUser, deleteUser, getUserStats };
