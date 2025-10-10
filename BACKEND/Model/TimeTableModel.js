const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timeTableSchema = new Schema({
    examName: {
        type: String,
        required: true,
        enum: ["1st Term", "2nd Term", "3rd Term"]
    },
    class: {
        type: String, // e.g., "A", "B", "C"
        required: true,
        enum: ["A", "B", "C"]
    },
    grade: {
        type: Number, // e.g., 1-11
        required: true,
        min: 1,
        max: 11
    },
    classSection: {
        type: String, // e.g., "1-A", "2-B", "6-C"
        required: true
    },
    category: {
        type: String,
        enum: ["Primary", "Secondary"], // Primary: 1-5, Secondary: 6-11
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

// Auto-assign category based on grade
timeTableSchema.pre("save", function (next) {
    if (this.grade >= 1 && this.grade <= 5) {
        this.category = "Primary";
    } else if (this.grade >= 6 && this.grade <= 11) {
        this.category = "Secondary";
    }
    
    // Auto-generate classSection if not provided
    if (!this.classSection) {
        this.classSection = `${this.grade}-${this.class}`;
    }
    
    next();
});

module.exports = mongoose.model("TimeTable", timeTableSchema);