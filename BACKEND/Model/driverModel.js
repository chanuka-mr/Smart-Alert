const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nicNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String
  },
  isActive: {
     type: Boolean, 
     default: true
     },
  availabilityStatus: {
    type: String,
    enum: ["available", "on-duty", "off-duty", "leave"],
    default: "available"
  },
  backgroundCheckStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  trainingCompleted: {
     type: Boolean, 
     default: false
     },
  ratings: { 
    type: Number, 
    default: 0
 },
  profileImageUrl: {
  type: String,
  default: ""
}
});


module.exports = mongoose.model("Driver", driverSchema);

