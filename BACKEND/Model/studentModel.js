const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: { 
    type: String,
     required: true, 
     unique: true, trim: true 
    },
  name: { 
    type: String, 
    required: true,
     trim: true 
    },
  route: { 
    type: String, 
    required: true, 
    trim: true
   },
  guardianName: { 
    type: String, 
    required: true,
     trim: true
     },
  parentContactNo: { 
    type: String,
     required: true,
      trim: true
     }
},);

module.exports = mongoose.model("Student", studentSchema);


