const mongoose = require("mongoose");  
const Schema = mongoose.Schema;        


const attendanceSchema = new Schema({
 
  student: {
    type: mongoose.Schema.Types.ObjectId,  
    ref: "StudentModel",                  
    required: true                      
  },
  
  
  date: {
    type: Date,
    required: true  
  },
  
  
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Excused"],  
    default: "Present"  
  },
  
  // Optional justification for absence or lateness
  justification: {
    type: String,
    default: ""  
  },
  
  // Flag to track if parent was notified about this attendance record
  notifiedParent: {
    type: Boolean,
    default: false  
  },
  
  // Timestamp when the attendance record was created
  createdAt: {
    type: Date,
    default: Date.now  // Automatically set to current date/time
  }
});


// Prevents duplicate attendance entries
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("AttendanceModel", attendanceSchema);