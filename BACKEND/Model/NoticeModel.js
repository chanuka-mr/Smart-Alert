const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noticeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,              // Every notice should have a title/headline
      trim: true
    },
    notice: {
      type: String,
      required: true,              // The content/body of the notice
      trim: true
    },
    attachment: {
      type: String,                // File upload (optional) → store filename, path, or URL
      required: false,
      default: null
    },
    createdBy: {
      type: String,                // Optional — name/ID of admin/teacher who posted
      required: false
    },
    category: {
      type: String,                // Optional classification (e.g., "Exam", "Holiday", "Event")
      enum: ["General", "Exam", "Holiday", "Event", "Other"],
      default: "General"
    },
    publishedAt: {
      type: Date,
      default: Date.now            // Auto-generate date/time notice was created
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }             // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("NotificationModel", noticeSchema);