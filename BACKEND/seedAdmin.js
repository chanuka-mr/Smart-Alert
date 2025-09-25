const mongoose = require("mongoose");
const { User, Login } = require("./Model/userModel");
const { generateUserIDForYear } = require("./utils/userIDGenerator");

// MongoDB connection
mongoose.connect(
  "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/smart-alert-db"
)
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

async function seedAdmin() {
  try {
    console.log("🚀 Starting Admin Seeding Process");
    console.log("==================================");
    console.log();

    // Check if any Admin already exists
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin already exists in the database:");
      console.log(`   UserID: ${existingAdmin.userID}`);
      console.log(`   Full Name: ${existingAdmin.fullName}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log();
      console.log("ℹ️  To create a new admin, please delete the existing one first or use the admin dashboard.");
      return process.exit(0);
    }

    console.log("📋 Creating new admin user...");
    
    // Generate userID for Admin role for current year
    const adminUserID = await generateUserIDForYear("Admin", new Date().getFullYear());
    console.log(`✅ Generated Admin userID: ${adminUserID}`);

    // Admin user details
    const adminData = {
      userID: adminUserID,
      fullName: "Chanakya Admin",
      birthday: new Date("2003-07-25"),
      address: "Admin Office, Smart Alert System",
      email: "jchanukamr@gmail.com",
      role: "Admin"
    };

    console.log("👤 Admin Details:");
    console.log(`   UserID: ${adminData.userID}`);
    console.log(`   Full Name: ${adminData.fullName}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Birthday: ${adminData.birthday.toDateString()}`);
    console.log(`   Address: ${adminData.address}`);
    console.log(`   Role: ${adminData.role}`);
    console.log();

    // Create User profile
    console.log("💾 Creating user profile...");
    const adminUser = new User(adminData);
    await adminUser.save();
    console.log("✅ User profile created successfully");

    // Create Login record with known password
    const loginData = {
      userID: adminUserID,
      username: adminData.email,
      password: "admin123", // This will be hashed by the pre-save hook
      isVerified: true
    };

    console.log("🔐 Creating login credentials...");
    console.log(`   Username: ${loginData.username}`);
    console.log(`   Password: ${loginData.password}`);
    console.log(`   Verified: ${loginData.isVerified}`);
    
    const adminLogin = new Login(loginData);
    await adminLogin.save();
    console.log("✅ Login credentials created successfully");
    console.log();

    // Display success message with login instructions
    console.log("🎉 Admin seeded successfully!");
    console.log("=============================");
    console.log();
    console.log("📝 Login Credentials:");
    console.log(`   UserID: ${adminUserID}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: admin123`);
    console.log();
    console.log("🔗 You can now login to the admin dashboard using these credentials.");
    console.log("💡 The admin will have full access to manage users, features, and system settings.");
    console.log();

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
    console.error("Stack trace:", err.stack);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log("\n⚠️  Process interrupted. Exiting...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("\n⚠️  Process terminated. Exiting...");
  process.exit(0);
});

// Run the seeding process
seedAdmin();