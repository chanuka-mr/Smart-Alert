const User = require("../Model/userModel");

// ✅ Get all users
const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
  } catch (err) {
    console.log(err);
  }

  if (!users || users.length === 0) {
    return res.status(404).json({ message: "No users found." });
  }

  return res.status(200).json({ users });
};

// ✅ Add a new user
const createUser = async (req, res, next) => {
  const { std_index, name, bday, age, address, email, password, role } = req.body;

  let user;
  try {
    user = new User({
      std_index,
      name,
      bday,
      age,
      address,
      email,
      password,
      role
    });
    await user.save();
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    return res.status(400).json({ message: "Unable to add user." });
  }

  return res.status(201).json({ user });
};

// ✅ Get user by ID
const getById = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findById(id);
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json({ user });
};

// ✅ Update user details
const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { std_index, name, bday, age, address, email, password, role } = req.body;

  let user;
  try {
    user = await User.findByIdAndUpdate(
      id,
      {
        std_index,
        name,
        bday,
        age,
        address,
        email,
        password,
        role
      },
      { new: true }
    );
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    return res.status(404).json({ message: "Unable to update user details." });
  }

  return res.status(200).json({ user });
};

// ✅ Delete user
const deleteUser = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    return res.status(404).json({ message: "Unable to delete user details." });
  }

  return res.status(200).json({ user });
};

module.exports = { getAllUsers, createUser, getById, updateUser, deleteUser };
