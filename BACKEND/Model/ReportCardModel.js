const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportCardSchema = new Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    studentName: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        required: true,
        min: 1,
        max: 11
    },
    class: {
        type: String,
        required: false 
    },
    category: {
        type: String,
        enum: ["Primary", "Secondary"], // Primary: 1-5, Secondary: 6-11
        required: false // Will be auto-generated
    },
    subjects: [{
        subjectName: {
            type: String,
            required: true
        },
        term1Marks: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        term2Marks: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        term3Marks: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        }
    }],
    teacherComments: {
        type: String,
        default: ""
    },
    academicYear: {
        type: String,
        default: new Date().getFullYear().toString()
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-assign category based on grade
reportCardSchema.pre("save", function (next) {
    // Always set category based on grade
    if (this.grade >= 1 && this.grade <= 5) {
        this.category = "Primary";
    } else if (this.grade >= 6 && this.grade <= 11) {
        this.category = "Secondary";
    } else {
        // Default fallback
        this.category = "Primary";
    }
    
    // Handle class - if it's just A, B, or C, combine with grade
    if (this.class && ['A', 'B', 'C'].includes(this.class)) {
        // If class is just a letter, combine it with grade
        this.class = `${this.grade}-${this.class}`;
    } else if (!this.class) {
        // Auto-generate class if not provided
        let section = 'A'; // Default section
        
        // Try to extract section from studentId
        const sectionMatch = this.studentId.match(/([A-C])$/);
        if (sectionMatch) {
            section = sectionMatch[1];
        } else {
            // For IDs like S1004, S1005, S1006, use a different logic
            // Extract last digit and map to section
            const lastDigit = this.studentId.match(/(\d)$/);
            if (lastDigit) {
                const digit = parseInt(lastDigit[1]);
                // Map digits to sections: 4->B, 5->B, 6->C, etc.
                const sectionMap = ['A', 'A', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D'];
                section = sectionMap[digit] || 'A';
            }
        }
        
        this.class = `${this.grade}-${section}`;
    }
    
    this.updatedAt = Date.now();
    next();
});

// Virtual for calculating overall average
reportCardSchema.virtual('overallAverage').get(function() {
    let totalMarks = 0;
    let totalSubjects = 0;
    
    this.subjects.forEach(subject => {
        let subjectTotal = 0;
        let termCount = 0;
        
        if (subject.term1Marks !== null) {
            subjectTotal += subject.term1Marks;
            termCount++;
        }
        if (subject.term2Marks !== null) {
            subjectTotal += subject.term2Marks;
            termCount++;
        }
        if (subject.term3Marks !== null) {
            subjectTotal += subject.term3Marks;
            termCount++;
        }
        
        if (termCount > 0) {
            totalMarks += subjectTotal / termCount;
            totalSubjects++;
        }
    });
    
    return totalSubjects > 0 ? totalMarks / totalSubjects : 0;
});

// Virtual for calculating term totals
reportCardSchema.virtual('termTotals').get(function() {
    let term1Total = 0, term2Total = 0, term3Total = 0;
    let term1Count = 0, term2Count = 0, term3Count = 0;
    
    this.subjects.forEach(subject => {
        if (subject.term1Marks !== null) {
            term1Total += subject.term1Marks;
            term1Count++;
        }
        if (subject.term2Marks !== null) {
            term2Total += subject.term2Marks;
            term2Count++;
        }
        if (subject.term3Marks !== null) {
            term3Total += subject.term3Marks;
            term3Count++;
        }
    });
    
    return {
        term1: term1Total,
        term2: term2Total,
        term3: term3Total,
        term1Count,
        term2Count,
        term3Count
    };
});

// Virtual for calculating term-wise averages
reportCardSchema.virtual('termAverages').get(function() {
    const termTotals = this.termTotals;
    
    return {
        term1Average: termTotals.term1Count > 0 ? termTotals.term1 / termTotals.term1Count : 0,
        term2Average: termTotals.term2Count > 0 ? termTotals.term2 / termTotals.term2Count : 0,
        term3Average: termTotals.term3Count > 0 ? termTotals.term3 / termTotals.term3Count : 0,
        term1Count: termTotals.term1Count,
        term2Count: termTotals.term2Count,
        term3Count: termTotals.term3Count
    };
});

module.exports = mongoose.model("ReportCard", reportCardSchema);
