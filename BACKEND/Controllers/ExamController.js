const Exam = require("../Model/ExamModel");
const PDFDocument = require("pdfkit");

// Get all exams
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.find();
        if (!exams) return res.status(404).json({ message: "Exams not found" });
        res.status(200).json({ exams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Add exam for a student
const addExam = async (req, res) => {
    const { studentId, name, classLevel, term, subjects } = req.body;
    try {
        const exam = new Exam({ studentId, name, classLevel, term, subjects });
        await exam.save();
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to add exam" });
    }
};

// Get exam by MongoDB ID
const getById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: "Exam not found" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get exam by student ID
const getByStudentId = async (req, res) => {
    try {
        const exam = await Exam.findOne({ studentId: req.params.studentId });
        if (!exam) return res.status(404).json({ message: "Result not found" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Update exam
const updateExam = async (req, res) => {
    const { studentId, name, classLevel, term, subjects } = req.body;
    try {
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { studentId, name, classLevel, term, subjects },
            { new: true }
        );
        if (!exam) return res.status(404).json({ message: "Unable to update exam" });
        await exam.save();
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete exam
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ message: "Unable to delete exam" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Download report card (PDF) - Modern Design
const downloadReport = async (req, res) => {
    try {
        const exam = await Exam.findOne({ studentId: req.params.studentId });
        if (!exam) return res.status(404).json({ message: "Report not found" });

        // Calculate class rank
        const classmates = await Exam.find({ classLevel: exam.classLevel, term: exam.term });
        classmates.sort((a, b) => b.totalMarks - a.totalMarks);
        const rank = classmates.findIndex(e => e.studentId === exam.studentId) + 1;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Report_${exam.studentId}.pdf`;

        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // --- Header ---
        doc.fontSize(22).fillColor("#1F4E79").text("WISTERIA HIGH SCHOOL", { align: "center" });
        doc.fontSize(14).fillColor("black").text("Report Card", { align: "center" });
        doc.moveDown(2);

        // --- Student Info ---
        doc.fontSize(11).fillColor("black");
        doc.text(`Name of Student: ${exam.name}`);
        doc.text(`Student ID: ${exam.studentId}`);
        doc.text(`Year and Section: ${exam.classLevel}`);
        doc.text(`Grading Period: ${exam.term}`);
        doc.text(`School Year: ${new Date().getFullYear()}`);
        doc.moveDown(2);

        // --- Subjects Table ---
        const tableTop = doc.y;
        const colWidths = [200, 80, 80, 80];
        const rowHeight = 25;

        // Header Row
        doc.rect(50, tableTop, 440, rowHeight).fill("#1F4E79");
        doc.fillColor("white").fontSize(11);
        doc.text("Subjects", 60, tableTop + 7);
        doc.text("1st", 260, tableTop + 7);
        doc.text("2nd", 340, tableTop + 7);
        doc.text("3rd", 420, tableTop + 7);

        // Subject Rows
        let y = tableTop + rowHeight;
        exam.subjects.forEach((s, i) => {
            const bgColor = i % 2 === 0 ? "#D9E1F2" : "#FFFFFF";
            doc.rect(50, y, 440, rowHeight).fill(bgColor);
            doc.fillColor("black").fontSize(11);
            doc.text(s.subject, 60, y + 7);
            doc.text(`${s.marks}`, 260, y + 7);
            doc.text(`${s.marks}`, 340, y + 7);
            doc.text(`${s.marks}`, 420, y + 7);
            y += rowHeight;
        });

        // --- Attendance ---
        doc.moveDown(2);
        doc.fontSize(12).fillColor("black").text("Attendance:", 50);
        doc.fontSize(11).text("Total Days of School: __________", 60);
        doc.text("Days Attended: __________", 60);
        doc.text("Days Absent: __________", 60);

        // --- Grade Summary ---
        doc.moveDown(2);
        doc.fontSize(12).text("Grade Summary:", 50);
        doc.fontSize(11).text(`Total Marks: ${exam.totalMarks} / ${exam.subjects.length * 100}`);
        doc.text(`Average Grade: ${exam.grade}`);
        doc.text(`Rank in Class: ${rank} / ${classmates.length}`);

        // --- Grading System ---
        doc.rect(350, 100, 150, 160).stroke("#1F4E79");
        doc.fontSize(11).fillColor("#1F4E79").text("Grading System:", 360, 110);
        doc.fillColor("black").fontSize(10);
        const grading = [
            ["A+", "97-100"], ["A", "94-96"], ["A-", "90-93"],
            ["B+", "87-89"], ["B", "84-86"], ["B-", "80-83"],
            ["C+", "77-79"], ["C", "74-76"], ["C-", "70-73"],
            ["D+", "67-69"], ["D", "64-66"], ["D-", "60-63"],
            ["F", "59 & below"]
        ];
        let gy = 130;
        grading.forEach(([grade, range]) => {
            doc.text(`${grade}: ${range}`, 360, gy);
            gy += 12;
        });

        // --- Teacher's Comments ---
        doc.moveDown(3);
        doc.fontSize(12).text("Teacher's Comments & Feedback:", 50);
        doc.rect(50, doc.y + 5, 450, 80).stroke("#1F4E79");

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error generating report" });
    }
};

module.exports = {
    getAllExams,
    addExam,
    getById,
    getByStudentId,
    updateExam,
    deleteExam,
    downloadReport
};
