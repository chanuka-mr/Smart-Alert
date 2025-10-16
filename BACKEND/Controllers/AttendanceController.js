const Attendance = require("../Model/AttendanceModel");
const { User, Academic, Parent } = require("../Model/userModel");

// Helper: check if string looks like a Mongo ObjectId
const looksLikeObjectId = (s) => typeof s === "string" && s.match(/^[0-9a-fA-F]{24}$/);

// Normalize any Date to midnight (local time)
const normalizeToMidnight = (d) => {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Helper to enrich a single attendance record with student info
const enrichRecordWithStudentInfo = async (record) => {
  const recordObj = record.toObject ? record.toObject() : record;
  
  if (recordObj.student && recordObj.student.userID) {
    // Get academic info
    const academic = await Academic.findOne({ userID: recordObj.student.userID });
    
    // Map User fields to expected Student fields for frontend compatibility
    recordObj.student.name = recordObj.student.fullName;
    recordObj.student.std_index = recordObj.student.userID;
    recordObj.student.section = academic ? `${academic.grade}${academic.class}` : 'N/A';
  }
  
  return recordObj;
};

// Get all attendance (sorted newest first)
const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate("student").sort({ date: -1, _id: -1 });
    
    // Enrich records with academic section info and map field names for frontend compatibility
    const enrichedRecords = await Promise.all(
      records.map(record => enrichRecordWithStudentInfo(record))
    );
    
    return res.status(200).json({ records: enrichedRecords });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Mark attendance by studentId (User._id) or userID
const markAttendance = async (req, res) => {
  const { studentId, userID, date, status, notifiedParent } = req.body;

  console.log("📝 Mark Attendance Request:", { studentId, userID, date, status });

  if (!studentId && !userID) {
    return res.status(400).json({ message: "Provide studentId (User._id) or userID" });
  }

  try {
    let student;
    if (studentId) {
      console.log("🔍 Searching by studentId (User._id):", studentId);
      if (!looksLikeObjectId(studentId)) {
        console.log("❌ Invalid studentId format:", studentId);
        return res.status(400).json({ message: "Invalid studentId" });
      }
      student = await User.findOne({ _id: studentId, role: "Parent" });
      console.log("👤 Student found by ID:", student ? student.fullName : "NOT FOUND");
    } else {
      console.log("🔍 Searching by userID:", userID);
      student = await User.findOne({ userID, role: "Parent" });
      console.log("👤 Student found by userID:", student ? student.fullName : "NOT FOUND");
    }
    if (!student) {
      console.log("❌ Student not found in database. StudentId:", studentId, "userID:", userID);
      
      // Debug: Show all students (users with role=Parent) in database
      const allStudents = await User.find({ role: "Parent" }).limit(10);
      console.log("📊 Total students in database:", await User.countDocuments({ role: "Parent" }));
      console.log("📋 Sample students:", allStudents.map(s => ({ id: s._id.toString(), name: s.fullName, userID: s.userID })));
      
      return res.status(404).json({ 
        message: "Student not found", 
        debug: {
          searchedId: studentId,
          searchedUserID: userID,
          totalStudentsInDb: await User.countDocuments({ role: "Parent" })
        }
      });
    }

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
    const enriched = await enrichRecordWithStudentInfo(populated);
    return res.status(200).json({ record: enriched });
  } catch (err) {
    // Handle duplicate-key errors from the unique index
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked for this student on this date" });
    }
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get attendance by studentId (User._id) or userID
const getAttendanceByStudent = async (req, res) => {
  const param = req.params.studentId;
  try {
    let student;
    if (looksLikeObjectId(param)) {
      student = await User.findOne({ _id: param, role: "Parent" });
    } else {
      student = await User.findOne({ userID: param, role: "Parent" });
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    const records = await Attendance.find({ student: student._id }).populate("student").sort({ date: -1, _id: -1 });
    const enrichedRecords = await Promise.all(
      records.map(record => enrichRecordWithStudentInfo(record))
    );
    return res.status(200).json({ records: enrichedRecords });
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
    const enriched = await enrichRecordWithStudentInfo(record);
    return res.status(200).json({ record: enriched });
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
    // Fetch students (users with role=Parent) in one go
    const ids = items.map((i) => i.studentId).filter(Boolean);
    const students = await User.find({ _id: { $in: ids }, role: "Parent" });

    const idToStudent = new Map(students.map((s) => [String(s._id), s]));
    const results = await Promise.allSettled(
      items.map(async (i) => {
        const student = idToStudent.get(String(i.studentId));
        if (!student) throw new Error("Student not found");
        
        // Get parent details from Parent schema
        const parentDetails = await Parent.findOne({ userID: student.userID });
        const phone = normalizeParentNumber(parentDetails?.whatsappNumber || student.phone);
        if (!phone) throw new Error("Invalid parent phone number");

        // Get academic info for grade/class
        const academic = await Academic.findOne({ userID: student.userID });

        const day = new Date(i.date || Date.now());
        const formattedDate = new Date(day.getTime() - (day.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 10);

        const message =
          `🎓 CMB International College - Smart Alert\n\n` +
          `📅 Date: ${formattedDate}\n` +
          `👤 Student: ${student.fullName}\n` +
          `🆔 ID: ${student.userID}\n` +
          `📚 Class: ${academic ? `Grade ${academic.grade}${academic.class}` : 'N/A'}\n` +
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

// Get attendance for currently logged-in parent (from req.user)
const getMyAttendance = async (req, res) => {
  try {
    console.log("📋 My Attendance Request received");
    console.log("   Headers:", req.headers.authorization ? "Token present" : "No token");
    console.log("   User from token:", req.user);

    // req.user should be set by auth middleware (contains { id: userID, role: role })
    if (!req.user || !req.user.id) {
      console.log("❌ No user in request");
      return res.status(401).json({ 
        message: "Unauthorized - User not authenticated",
        debug: "No user found in request. Please log in again."
      });
    }

    console.log("   UserID:", req.user.id);
    console.log("   Role:", req.user.role);

    // Check if user is a parent
    if (req.user.role !== "Parent") {
      console.log("❌ Access denied - User role is:", req.user.role);
      return res.status(403).json({ 
        message: `Access denied - Only parents/students can view this page. Your role: ${req.user.role}` 
      });
    }

    // Find the user by userID (req.user.id is the userID from JWT)
    const student = await User.findOne({ userID: req.user.id, role: "Parent" });
    if (!student) {
      console.log("❌ Student not found for userID:", req.user.id);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("✅ Student found:", student.fullName);

    // Get attendance records for this student
    const records = await Attendance.find({ student: student._id })
      .populate("student")
      .sort({ date: -1 });

    // Enrich records with student info
    const enrichedRecords = await Promise.all(
      records.map(record => enrichRecordWithStudentInfo(record))
    );

    // Get academic info
    const academic = await Academic.findOne({ userID: student.userID });
    const section = academic ? `${academic.grade}${academic.class}` : 'N/A';

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      late: records.filter(r => r.status === "Late").length,
      excused: records.filter(r => r.status === "Excused").length
    };

    stats.attendancePercentage = stats.total > 0 
      ? ((stats.present + stats.excused) / stats.total * 100).toFixed(2) 
      : 0;

    return res.status(200).json({ 
      student: {
        userID: student.userID,
        name: student.fullName,
        email: student.email,
        section: section
      },
      records: enrichedRecords,
      stats
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllAttendance,
  markAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  notifyParentsForAbsents,
  getMyAttendance
};

