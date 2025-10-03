const mongoose = require("mongoose");

const shuttleSchema = new mongoose.Schema({
  vehicleNo: {
    type: String,
    required: true,
    unique: true, // Each vehicle must have a unique number
  },
  driverName: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Contact number must be 10 digits"], // basic validation
  },
  contactNumber: {
    type: String,
    match: [/^\d{10}$/, "Contact number must be 10 digits"], // Alternative field name
  },
  route: {
    type: String, // Example: "Marine Drive Railway Station → Senanayake Junction → School"
    required: true,
  },
  startingLocation: {
    name: {
      type: String,
      default: 'Not specified',
    },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  endingLocation: {
    name: {
      type: String,
      default: 'Not specified',
    },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  waypoints: [{
    name: { type: String },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    description: { type: String } // e.g., "Pickup point", "Drop off point"
  }],
  schedule: {
    startTime: { type: String, default: 'Not specified' }, // e.g., "7:00 AM"
    frequency: { type: String, default: "Daily" } // Daily, Weekdays, Weekends
  }
});

module.exports = mongoose.model("Shuttle", shuttleSchema);
