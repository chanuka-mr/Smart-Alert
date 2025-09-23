const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const examSchema = new Schema({
    studentId: {
        type: String, // Unique student identifier (admission number or roll number)
        required: true,
        index: true
    },
    name: {
        type: String, // Student name
        required: true
    },
    classLevel: {
        type: Number, // e.g. 1–11
        required: true,
        index: true
    },
    term: {
        type: String, // e.g. "Term 1", "Final"
        required: true
    },
    subjects: [
        {
            subject: { type: String, required: true },
            term1: { type: Number, min: 0, max: 100, default: 0 },
            term2: { type: Number, min: 0, max: 100, default: 0 },
            term3: { type: Number, min: 0, max: 100, default: 0 }
        }
    ],
    totalMarks: {
        type: Number,
        default: 0
    },
    average: {
        type: Number,
        default: 0
    },
    grade: {
        type: String
    },
    rank: {
        type: Number, // Student’s position in the class
        default: null
    }
});

// --- Helper function to calculate grade ---
function calculateGrade(avg) {
    if (avg >= 75) return "A";
    if (avg >= 65) return "B";
    if (avg >= 50) return "C";
    if (avg >= 35) return "S";
    return "F";
}

// --- Pre-save middleware: calculate total, average, and grade ---
examSchema.pre("save", function (next) {
    // Total of all terms for all subjects
    this.totalMarks = this.subjects.reduce(
        (sum, subj) => sum + (subj.term1 + subj.term2 + subj.term3),
        0
    );

    // Average = total / number of marks (3 terms * subjects)
    const marksCount = this.subjects.length * 3;
    this.average = marksCount > 0 ? this.totalMarks / marksCount : 0;

    this.grade = calculateGrade(this.average);
    next();
});

// --- Static method: recalculate ranks for a class ---
examSchema.statics.updateClassRanks = async function (classLevel, term) {
    const exams = await this.find({ classLevel, term }).sort({ totalMarks: -1 });

    let rank = 1;
    for (let i = 0; i < exams.length; i++) {
        if (i > 0 && exams[i].totalMarks < exams[i - 1].totalMarks) {
            rank = i + 1;
        }
        exams[i].rank = rank;
        await exams[i].save();
    }
};

module.exports = mongoose.model("ExamModel", examSchema);
