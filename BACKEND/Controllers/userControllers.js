const { User, Login } = require("../Model/userModel");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    return res.status(200).json({ users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a new user (Admin only)
const createUser = async (req, res) => {
  const { userID, fullName, birthday, address, email, role } = req.body;

  try {
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

    return res.status(201).json({ user, login });
  } catch (err) {
    console.log(err);
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
    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
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

    return res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllUsers, createUser, getById, updateUser, deleteUser };
