const Location = require("../Model/locationModel");
const Shuttle = require("../Model/shuttleModel");
const Student = require("../Model/studentModel");

// Get current location of a shuttle
exports.getShuttleLocation = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    
    const location = await Location.findOne({ 
      shuttleId, 
      isActive: true 
    }).sort({ timestamp: -1 });
    
    if (!location) {
      return res.status(404).json({ message: "No active location found for this shuttle" });
    }
    
    res.status(200).json(location);
  } catch (err) {
    console.error("Error fetching shuttle location:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get location history for a shuttle
exports.getShuttleLocationHistory = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const { limit = 50, startDate, endDate } = req.query;
    
    let query = { shuttleId };
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json(locations);
  } catch (err) {
    console.error("Error fetching location history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update shuttle location
exports.updateShuttleLocation = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const { latitude, longitude, address, speed, heading } = req.body;
    
    // Verify shuttle exists
    const shuttle = await Shuttle.findById(shuttleId);
    if (!shuttle) {
      return res.status(404).json({ message: "Shuttle not found" });
    }
    
    // Create new location record
    const location = new Location({
      shuttleId,
      latitude,
      longitude,
      address,
      speed,
      heading,
      timestamp: new Date()
    });
    
    const savedLocation = await location.save();
    
    // Emit real-time update via Socket.IO
    req.io.emit('locationUpdate', {
      shuttleId,
      location: savedLocation,
      shuttle: shuttle
    });
    
    res.status(201).json(savedLocation);
  } catch (err) {
    console.error("Error updating shuttle location:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active shuttle locations
exports.getAllActiveLocations = async (req, res) => {
  try {
    const locations = await Location.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$shuttleId",
          latestLocation: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "shuttles",
          localField: "_id",
          foreignField: "_id",
          as: "shuttle"
        }
      },
      {
        $unwind: "$shuttle"
      }
    ]);
    
    res.status(200).json(locations);
  } catch (err) {
    console.error("Error fetching active locations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update student location (if they have a tracking device)
exports.updateStudentLocation = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { latitude, longitude, address } = req.body;
    
    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Create new location record
    const location = new Location({
      studentId,
      latitude,
      longitude,
      address,
      timestamp: new Date()
    });
    
    const savedLocation = await location.save();
    
    // Emit real-time update via Socket.IO
    req.io.emit('studentLocationUpdate', {
      studentId,
      location: savedLocation,
      student: student
    });
    
    res.status(201).json(savedLocation);
  } catch (err) {
    console.error("Error updating student location:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get student location
exports.getStudentLocation = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const location = await Location.findOne({ 
      studentId, 
      isActive: true 
    }).sort({ timestamp: -1 });
    
    if (!location) {
      return res.status(404).json({ message: "No active location found for this student" });
    }
    
    res.status(200).json(location);
  } catch (err) {
    console.error("Error fetching student location:", err);
    res.status(500).json({ message: "Server error" });
  }
};
