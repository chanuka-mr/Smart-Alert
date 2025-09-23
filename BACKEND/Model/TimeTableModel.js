const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timeTableSchema = new Schema({
    examName: {
        type: String,
        required: true
    },
    section: {
        type: String, // e.g., "A", "B"
        required: true
    },
    classLevel: {
        type: Number, // e.g., 1-11
        required: true,
        min: 1,
        max: 11
    },
    category: {
        type: String,
        enum: ["Primary", "Ordinary"], // auto-handled
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    examDate: {
        type: Date,
        required: true
    },
    examTime: {
        type: String, // e.g., "9:00 AM - 11:00 AM"
        required: true
    },
    hall: {
        type: String, // e.g., "Hall 1", "Classroom 6B"
        required: true
    }
});

// Auto-assign category based on classLevel
timeTableSchema.pre("save", function (next) {
    if (this.classLevel >= 1 && this.classLevel <= 5) {
        this.category = "Primary";
    } else {
        this.category = "Ordinary";
    }
    next();
});

module.exports = mongoose.model("TimeTable", timeTableSchema);
