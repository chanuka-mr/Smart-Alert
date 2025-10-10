// Migration script to copy notices and chat data from "Notices" database to "smart-alert-db"
require("dotenv").config();
const mongoose = require("mongoose");

const SOURCE_DB = "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/Notices";
const TARGET_DB = "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/smart-alert-db";

async function migrateData() {
  try {
    console.log("🔄 Starting migration...");
    
    // Connect to source database (Notices)
    const sourceConn = await mongoose.createConnection(SOURCE_DB).asPromise();
    console.log("✅ Connected to source database (Notices)");
    
    // Connect to target database (smart-alert-db)
    const targetConn = await mongoose.createConnection(TARGET_DB).asPromise();
    console.log("✅ Connected to target database (smart-alert-db)");
    
    // Get collections from source
    const sourceNotices = sourceConn.collection('notificationmodels');
    const sourceChatMessages = sourceConn.collection('chatmessages');
    
    // Get collections from target
    const targetNotices = targetConn.collection('notificationmodels');
    const targetChatMessages = targetConn.collection('chatmessages');
    
    // Migrate Notices
    console.log("\n📋 Migrating notices...");
    const notices = await sourceNotices.find({}).toArray();
    if (notices.length > 0) {
      await targetNotices.insertMany(notices);
      console.log(`✅ Migrated ${notices.length} notices`);
    } else {
      console.log("ℹ️  No notices found to migrate");
    }
    
    // Migrate Chat Messages
    console.log("\n💬 Migrating chat messages...");
    const chatMessages = await sourceChatMessages.find({}).toArray();
    if (chatMessages.length > 0) {
      await targetChatMessages.insertMany(chatMessages);
      console.log(`✅ Migrated ${chatMessages.length} chat messages`);
    } else {
      console.log("ℹ️  No chat messages found to migrate");
    }
    
    console.log("\n🎉 Migration completed successfully!");
    
    // Close connections
    await sourceConn.close();
    await targetConn.close();
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateData();
