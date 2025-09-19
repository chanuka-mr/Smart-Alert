const mongoose = require("mongoose");
const { User, Login } = require("./Model/userModel"); // adjust path if needed

// MongoDB connection
mongoose.connect(
  "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/yourDBName",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

async function seedAdmin() {
  try {
    // Check if Admin already exists
    const existingAdmin = await User.findOne({ userID: "A001" });
    if (existingAdmin) {
      console.log("Admin already exists");
      return process.exit();
    }

    // Create User profile
    const adminUser = new User({
      userID: "A001",
      fullName: "Chanakya Admin",
      birthday: new Date("2003-07-25"),
      address: "Admin Office",
      email: "jchanukamr@gmail.com",
      role: "Admin"
    });
    await adminUser.save();

    // Create Login record with known password
    const adminLogin = new Login({
      userID: "A001",
      username: "jchanukamr@gmail.com",
      password: "admin123", // plain password; will be hashed automatically
      isVerified: true
    });
    await adminLogin.save();

    console.log("Admin seeded successfully!");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

seedAdmin();
