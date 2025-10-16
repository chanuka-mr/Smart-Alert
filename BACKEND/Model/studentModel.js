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
    grade: {
        type: Number,
        required: true,
        min: 1,
        max: 11,
        validate: {
            validator: Number.isInteger,
            message: 'Grade must be an integer between 1 and 11'
        }
    },
    class: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C'],
        uppercase: true
    },
    section: {
        type: String,
        required: true,
    },
    parentUserID: {
        type: String,
        required: true,
        ref: 'User'  // Reference to the parent's userID in User model
    },
    parentName: {
        type: String,
        required: true,
    },
    parentPhoneNum: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

// Virtual field to get full class name (e.g., "Grade 5A")
studentSchema.virtual('className').get(function() {
    return `Grade ${this.grade}${this.class}`;
});

// Virtual field to calculate age from birthday
studentSchema.virtual('age').get(function() {
    if (!this.birthday) return null;
    const today = new Date();
    let age = today.getFullYear() - this.birthday.getFullYear();
    const monthDiff = today.getMonth() - this.birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthday.getDate())) {
        age--;
    }
    return age;
});

// Index for efficient queries
studentSchema.index({ grade: 1, class: 1 });
studentSchema.index({ parentUserID: 1 });

module.exports = mongoose.model("StudentModel", studentSchema);


