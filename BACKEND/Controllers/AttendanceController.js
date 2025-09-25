const Attendance = require("../Model/AttendanceModel");
const Student = require("../Model/StudentModel");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);

// Normalize any Date to midnight (local time)
const normalizeToMidnight = (d) => {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Get all attendance (sorted newest first)
const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate("student").sort({ date: -1, _id: -1 });
    return res.status(200).json({ records });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Mark attendance by studentId or std_index
const markAttendance = async (req, res) => {
  const { studentId, std_index, date, status, notifiedParent } = req.body;

  if (!studentId && !std_index) {
    return res.status(400).json({ message: "Provide studentId or std_index" });
  }

  try {
    let student;
    if (studentId) {
      if (!looksLikeObjectId(studentId)) return res.status(400).json({ message: "Invalid studentId" });
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ std_index });
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    const day = normalizeToMidnight(date);

    // Enforce 1 mark per student per day
    const existing = await Attendance.findOne({ student: student._id, date: day });
    if (existing) {
      return res.status(409).json({ message: "Attendance already marked for this student on this date" });
    }

    const record = new Attendance({
      student: student._id,
      date: day,
      status: status || "Present",
      notifiedParent: Boolean(notifiedParent)
    });

    await record.save();
    const populated = await Attendance.findById(record._id).populate("student");
    return res.status(200).json({ record: populated });
  } catch (err) {
    // Handle duplicate-key errors from the unique index
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked for this student on this date" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get attendance by studentId or std_index
const getAttendanceByStudent = async (req, res) => {
  const param = req.params.studentId;
  try {
    let student;
    if (looksLikeObjectId(param)) {
      student = await Student.findById(param);
    } else {
      student = await Student.findOne({ std_index: param });
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    const records = await Attendance.find({ student: student._id }).populate("student").sort({ date: -1, _id: -1 });
    return res.status(200).json({ records });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update attendance by attendance _id
const updateAttendance = async (req, res) => {
  const id = req.params.id;
  const { status, justification, notifiedParent, date } = req.body;

  try {
    const update = {};
    if (status) update.status = status;
    if (typeof justification !== "undefined") update.justification = justification;
    if (typeof notifiedParent !== "undefined") update.notifiedParent = notifiedParent;
    if (date) update.date = normalizeToMidnight(date);

    // If date is being changed, we rely on the unique index to prevent collisions
    const record = await Attendance.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate("student");
    if (!record) return res.status(404).json({ message: "Attendance not found" });
    return res.status(200).json({ record });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Another record already exists for this student and date" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete attendance
const deleteAttendance = async (req, res) => {
  const id = req.params.id;
  try {
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ message: "Attendance not found" });
    return res.status(200).json({ record });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const twilio = require("twilio");

const sendWhatsApp = async ({ to, body }) => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body
  });
};

const normalizeParentNumber = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  
  // Remove all non-digit characters except +
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith("+")) return cleaned; // already with country code
  
  // If it starts with 0, remove it and add country code
  if (cleaned.startsWith("0")) {
    const cc = process.env.DEFAULT_PHONE_COUNTRY_CODE || "+94";
    return `${cc}${cleaned.substring(1)}`;
  }
  
  // If it doesn't start with + or 0, add country code
  const cc = process.env.DEFAULT_PHONE_COUNTRY_CODE || "+94";
  return `${cc}${cleaned}`;
};

// POST /attendance/notify-parents
// Body: { items: [{ studentId, status, date }] }
const notifyParentsForAbsents = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items required" });
  }

  try {
    // Fetch students in one go
    const ids = items.map((i) => i.studentId).filter(Boolean);
    const students = await Student.find({ _id: { $in: ids } });

    const idToStudent = new Map(students.map((s) => [String(s._id), s]));
    const results = await Promise.allSettled(
      items.map(async (i) => {
        const student = idToStudent.get(String(i.studentId));
        if (!student) throw new Error("Student not found");
        
        const phone = normalizeParentNumber(student.parentPhoneNum);
        if (!phone) throw new Error("Invalid parent phone number");

        const day = new Date(i.date || Date.now());
        const formattedDate = new Date(day.getTime() - (day.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 10);

        const message =
          `🎓 CMB International College - Smart Alert\n\n` +
          `📅 Date: ${formattedDate}\n` +
          `👤 Student: ${student.name}\n` +
          `🆔 Index: ${student.std_index}\n` +
          `📚 Class: ${student.section}\n` +
          `📊 Status: ${i.status}\n\n` +
          `This is an automated notification from the school attendance system.`;

        await sendWhatsApp({ to: phone, body: message });
        return { studentId: i.studentId, success: true };
      })
    );

    const succeeded = [];
    const failed = [];
    results.forEach((r, idx) => {
      const sid = items[idx].studentId;
      if (r.status === "fulfilled") {
        succeeded.push(sid);
      } else {
        failed.push({ studentId: sid, error: r.reason?.message || "Failed" });
      }
    });

    return res.status(200).json({ succeeded, failed });
  } catch (err) {
    console.error("WhatsApp notification error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllAttendance,
  markAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  notifyParentsForAbsents
};

