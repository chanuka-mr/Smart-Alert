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

async function listAdmins() {
  try {
    console.log("📋 Current Admin Users");
    console.log("=====================");
    console.log();

    const admins = await User.find({ role: "Admin" }).sort({ userID: 1 });
    
    if (admins.length === 0) {
      console.log("❌ No admin users found in the database.");
      return;
    }

    console.log(`Found ${admins.length} admin user(s):`);
    console.log();

    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      const login = await Login.findOne({ userID: admin.userID });
      
      console.log(`${i + 1}. ${admin.fullName}`);
      console.log(`   UserID: ${admin.userID}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Address: ${admin.address}`);
      console.log(`   Birthday: ${admin.birthday.toDateString()}`);
      console.log(`   Verified: ${login ? login.isVerified : 'Unknown'}`);
      console.log(`   Created: ${admin.createdAt.toLocaleString()}`);
      console.log();
    }
  } catch (err) {
    console.error("❌ Error listing admins:", err.message);
  }
}

async function createAdmin() {
  try {
    console.log("🚀 Creating New Admin User");
    console.log("===========================");
    console.log();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin already exists:");
      console.log(`   UserID: ${existingAdmin.userID}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log();
      console.log("ℹ️  Use 'force' command to replace existing admin or delete manually first.");
      return;
    }

    // Generate userID
    const adminUserID = await generateUserIDForYear("Admin", new Date().getFullYear());
    console.log(`✅ Generated Admin userID: ${adminUserID}`);

    // Admin data
    const adminData = {
      userID: adminUserID,
      fullName: "Chanakya Admin",
      birthday: new Date("2003-07-25"),
      address: "Admin Office, Smart Alert System",
      email: "jchanukamr@gmail.com",
      role: "Admin"
    };

    // Create user
    const adminUser = new User(adminData);
    await adminUser.save();
    console.log("✅ User profile created");

    // Create login
    const adminLogin = new Login({
      userID: adminUserID,
      username: adminData.email,
      password: "admin123",
      isVerified: true
    });
    await adminLogin.save();
    console.log("✅ Login credentials created");

    console.log();
    console.log("🎉 Admin created successfully!");
    console.log("📝 Login Credentials:");
    console.log(`   UserID: ${adminUserID}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: admin123`);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
}

async function forceCreateAdmin() {
  try {
    console.log("🚀 FORCE Creating New Admin User");
    console.log("=================================");
    console.log();

    // Delete existing admin
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("🗑️  Deleting existing admin...");
      await User.deleteOne({ _id: existingAdmin._id });
      await Login.deleteOne({ userID: existingAdmin.userID });
      console.log("✅ Existing admin deleted");
    }

    // Create new admin
    await createAdmin();
  } catch (err) {
    console.error("❌ Error force creating admin:", err.message);
  }
}

async function deleteAdmin(userID) {
  try {
    console.log(`🗑️  Deleting Admin: ${userID}`);
    console.log("=============================");
    console.log();

    const admin = await User.findOne({ userID, role: "Admin" });
    if (!admin) {
      console.log(`❌ Admin with userID '${userID}' not found.`);
      return;
    }

    // Delete user and login
    await User.deleteOne({ _id: admin._id });
    await Login.deleteOne({ userID });
    
    console.log(`✅ Admin '${userID}' deleted successfully.`);
  } catch (err) {
    console.error("❌ Error deleting admin:", err.message);
  }
}

async function showHelp() {
  console.log("🔧 Admin Manager - Usage Guide");
  console.log("==============================");
  console.log();
  console.log("Commands:");
  console.log("  node adminManager.js list     - List all admin users");
  console.log("  node adminManager.js create   - Create new admin (if none exists)");
  console.log("  node adminManager.js force    - Force create admin (replace existing)");
  console.log("  node adminManager.js delete <userID> - Delete specific admin");
  console.log("  node adminManager.js help     - Show this help message");
  console.log();
  console.log("Examples:");
  console.log("  node adminManager.js list");
  console.log("  node adminManager.js create");
  console.log("  node adminManager.js force");
  console.log("  node adminManager.js delete A250001");
  console.log();
}

// Main function
async function main() {
  const command = process.argv[2];
  const userID = process.argv[3];

  switch (command) {
    case 'list':
      await listAdmins();
      break;
    case 'create':
      await createAdmin();
      break;
    case 'force':
      await forceCreateAdmin();
      break;
    case 'delete':
      if (!userID) {
        console.log("❌ Please provide userID to delete.");
        console.log("Usage: node adminManager.js delete <userID>");
        process.exit(1);
      }
      await deleteAdmin(userID);
      break;
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
    default:
      console.log("❌ Unknown command. Use 'help' to see available commands.");
      await showHelp();
      process.exit(1);
  }

  process.exit(0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log("\n⚠️  Process interrupted. Exiting...");
  process.exit(0);
});

// Run the main function
main().catch(err => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
