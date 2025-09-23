const TimeTable = require("../Model/TimeTableModel");

// Get all timetables
const getAllTimeTables = async (req, res, next) => {
    let timetables;
    try {
        timetables = await TimeTable.find();
    } catch (err) {
        console.log(err);
    }
    if (!timetables) {
        return res.status(404).json({ message: "No timetable found" });
    }
    return res.status(200).json({ timetables });
};

// Add a new timetable
const addTimeTable = async (req, res, next) => {
    const { examName, section, classLevel, subject, examDate, examTime, hall } = req.body;

    // ✅ Calculate category based on classLevel
    const category = (classLevel >= 1 && classLevel <= 5) ? "Primary" : "Ordinary";

    let timetable;
    try {
        timetable = new TimeTable({
            examName,
            section,
            classLevel,
            category,
            subject,
            examDate,
            examTime,
            hall
        });
        await timetable.save();
    } catch (err) {
        console.log(err);
    }

    if (!timetable) {
        return res.status(500).json({ message: "Unable to add timetable" });
    }
    return res.status(200).json({ timetable });
};


// Get timetable by ID
const getById = async (req, res, next) => {
    const id = req.params.id;
    let timetable;
    try {
        timetable = await TimeTable.findById(id);
    } catch (err) {
        console.log(err);
    }
    if (!timetable) {
        return res.status(404).json({ message: "Timetable not found" });
    }
    return res.status(200).json({ timetable });
};

// Update timetable
const updateTimeTable = async (req, res, next) => {
    const id = req.params.id;
    const { examName, section, classLevel, subject, examDate, examTime, hall } = req.body;

    const category = (classLevel >= 1 && classLevel <= 5) ? "Primary" : "Ordinary";

    let timetable;
    try {
        timetable = await TimeTable.findByIdAndUpdate(
            id,
            { examName, section, classLevel, category, subject, examDate, examTime, hall },
            { new: true }
        );
    } catch (err) {
        console.log(err);
    }

    if (!timetable) {
        return res.status(404).json({ message: "Unable to update timetable" });
    }
    return res.status(200).json({ timetable });
};


// Delete timetable
const deleteTimeTable = async (req, res, next) => {
    const id = req.params.id;
    let timetable;
    try {
        timetable = await TimeTable.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
    }
    if (!timetable) {
        return res.status(404).json({ message: "Unable to delete timetable" });
    }
    return res.status(200).json({ timetable });
};

module.exports = {
  getAllTimeTables,
  addTimeTable,
  getById,
  updateTimeTable,
  deleteTimeTable
};
