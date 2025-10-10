const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  shuttleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shuttle',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false // Optional - for student tracking
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  address: {
    type: String,
    required: false
  },
  speed: {
    type: Number,
    required: false,
    min: 0
  },
  heading: {
    type: Number,
    required: false,
    min: 0,
    max: 360
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
locationSchema.index({ shuttleId: 1, timestamp: -1 });
locationSchema.index({ studentId: 1, timestamp: -1 });
locationSchema.index({ isActive: 1, timestamp: -1 });

module.exports = mongoose.model("Location", locationSchema);
