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
        unique: true,   // each student has unique index no
    },
    section: {
        type: String,
        required: true,
    },
    parentName: {
        type: String,
        required: true,
    },
    parentPhoneNum: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("StudentModel", studentSchema);