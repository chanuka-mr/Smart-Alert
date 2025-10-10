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
    grade: {
        type: Number, // e.g. 1–11
        required: true,
        index: true
    },
    term: {
        type: String, // e.g. "Term 1.."
        required: true
    },
    subjects: [
        {
            subject: { type: String, required: false },
            term1: { type: Number, min: 0, max: 100 },
            term2: { type: Number, min: 0, max: 100 },
            term3: { type: Number, min: 0, max: 100 }
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
    letterGrade: {
        type: String,
        validate: {
            validator: function(v) {
                // letterGrade must be a string that is not a purely numeric value
                if (v === null || v === undefined) return true;
                if (typeof v !== 'string') return false;
                return !/^\d+$/.test(v.trim());
            },
            message: props => `${props.value} is not a valid letter grade string`
        }
    },
    rank: {
        type: Number, // Student’s position in the class
        default: null
    },
    feedback: {
        type: String,
        default: ""
    }
});

// --- Helper function to calculate grade ---
function calculateGrade(avg) {
    if (avg >= 97) return "A+";
    if (avg >= 94) return "A";
    if (avg >= 90) return "A-";
    if (avg >= 87) return "B+";
    if (avg >= 84) return "B";
    if (avg >= 80) return "B-";
    if (avg >= 77) return "C+";
    if (avg >= 74) return "C";
    if (avg >= 70) return "C-";
    if (avg >= 67) return "D+";
    if (avg >= 64) return "D";
    if (avg >= 60) return "D-";
    return "F";
}

// Pre-save middleware: calculate total, average, and grade 
examSchema.pre("save", function (next) {
    // Calculate final mark per subject as average of available term marks,
    // then totalMarks is sum of those final marks (each subject out of 100)
    let total = 0;
    this.subjects.forEach(subj => {
        const marks = [subj.term1, subj.term2, subj.term3].filter(m => typeof m === 'number');
        const subjFinal = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
        total += subjFinal;
    });
    this.totalMarks = total;

    // Average = total / number of subjects (each subject final mark is out of 100)
    this.average = this.subjects.length > 0 ? this.totalMarks / this.subjects.length : 0;

    this.letterGrade = calculateGrade(this.average);
    next();
});

// --- Static method: recalculate ranks for a class ---
examSchema.statics.updateClassRanks = async function (grade, term) {
    const exams = await this.find({ grade, term }).sort({ totalMarks: -1 });

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
