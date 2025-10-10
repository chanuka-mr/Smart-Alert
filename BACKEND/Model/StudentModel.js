

const mongoose = require("mongoose");  
const Schema = mongoose.Schema;        


const studentSchema = new Schema({
    
    name: {
        type: String,
        required: true,  
    },
    
    
    std_index: {
        type: String,
        required: true,     
        unique: true,       
    },
    
    
    section: {
        type: String,
        required: true,  
    },
    
    
    parentName: {
        type: String,
        required: true,  // Required for parent notifications
    },
    
    
    parentPhoneNum: {
        type: String,
        required: true,  
    },
    
    
    createdAt: {
        type: Date,
        default: Date.now,  // Automatically set to current date/time
    }
});


module.exports = mongoose.model("StudentModel", studentSchema);