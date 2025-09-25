// not final yet
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    ref: 'User'
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_created',
      'user_updated', 
      'user_deleted',
      'user_viewed',
      'login',
      'logout',
      'dashboard_viewed',
      'profile_viewed'
    ]
  },
  targetType: {
    type: String,
    enum: ['user', 'profile', 'dashboard', 'system']
  },
  targetId: {
    type: String // ID of the target (user ID, etc.)
  },
  targetName: {
    type: String // Name of the target (user name, etc.)
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed // Additional details about the action
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
activitySchema.index({ adminId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
