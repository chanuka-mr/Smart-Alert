// Mongoose model for school notices/announcements
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for a notice
const noticeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,              // Title/headline of the notice (required)
      trim: true
    },
    notice: {
      type: String,
      required: true,              // Main content/body of the notice (required)
      trim: true
    },
    attachment: {
      type: String,                // File path or URL for an optional attachment
      required: false,
      default: null
    },
    createdBy: {
      type: String,                // Name/ID of admin/teacher who posted (optional)
      required: false
    },
    category: {
      type: String,                // Category of notice (Exam, Holiday, etc.)
      enum: ["General", "Exam", "Holiday", "Event", "Other"],
      default: "General"
    },
    publishedAt: {
      type: Date,
      default: Date.now            // Date/time notice was created
    },
    updatedAt: {
      type: Date,
      default: Date.now            // Date/time notice was last updated
    }
  },
  { timestamps: true }             // Automatically adds createdAt and updatedAt fields
);

// Export the model for use in controllers/routes
module.exports = mongoose.model("NotificationModel", noticeSchema);