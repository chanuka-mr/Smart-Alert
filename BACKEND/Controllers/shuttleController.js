const Shuttle = require("../Model/shuttleModel");

// GET all shuttles
exports.getAllShuttles = async (req, res) => {
  try {
    const shuttles = await Shuttle.find();
    res.status(200).json(shuttles);
  } catch (err) {
    console.error("Error fetching shuttles:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET shuttle by ID
exports.getById = async (req, res) => {
  try {
    const shuttle = await Shuttle.findById(req.params.id);
    if (!shuttle) return res.status(404).json({ message: "Shuttle not found" });
    res.status(200).json(shuttle);
  } catch (err) {
    console.error("Error fetching shuttle:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD a new shuttle
exports.addShuttle = async (req, res) => {
  try {
    const { 
      vehicleNo, 
      driverName, 
      contactNo, 
      route, 
      routeName, 
      contactNumber,
      startingLocation,
      endingLocation,
      waypoints,
      schedule
    } = req.body;

    console.log('Received data:', req.body); // Debug log

    // Validate required fields
    if (!vehicleNo || !driverName || !contactNo) {
      return res.status(400).json({ message: "Vehicle number, driver name, and contact number are required" });
    }

    // Map frontend field names to backend field names and ensure consistency
    const mappedData = {
      vehicleNo: vehicleNo,
      driverName: driverName,
      contactNo: contactNo || contactNumber,
      contactNumber: contactNumber || contactNo,
      route: route || routeName || 'Not specified'
    };

    // Only add location fields if they exist and have valid data
    if (startingLocation && startingLocation.name && startingLocation.name.trim() !== '') {
      mappedData.startingLocation = {
        name: startingLocation.name,
        coordinates: {
          lat: startingLocation.coordinates?.lat || 0,
          lng: startingLocation.coordinates?.lng || 0
        }
      };
    }

    if (endingLocation && endingLocation.name && endingLocation.name.trim() !== '') {
      mappedData.endingLocation = {
        name: endingLocation.name,
        coordinates: {
          lat: endingLocation.coordinates?.lat || 0,
          lng: endingLocation.coordinates?.lng || 0
        }
      };
    }

    // Only add waypoints if they exist
    if (waypoints && waypoints.length > 0) {
      mappedData.waypoints = waypoints;
    }

    // Only add schedule if it has valid data
    if (schedule && schedule.startTime && schedule.startTime.trim() !== '') {
      mappedData.schedule = {
        startTime: schedule.startTime,
        frequency: schedule.frequency || 'Daily'
      };
    }

    console.log('Mapped data:', mappedData); // Debug log

    const shuttle = new Shuttle(mappedData);
    const savedShuttle = await shuttle.save();

    console.log('Saved shuttle:', savedShuttle); // Debug log
    res.status(201).json(savedShuttle);
  } catch (err) {
    console.error("Error adding shuttle:", err);

    if (err.code === 11000) {
      return res.status(409).json({ message: "Vehicle number already exists" });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation error", errors });
    }

    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE shuttle
exports.updateShuttle = async (req, res) => {
  try {
    const { 
      vehicleNo, 
      driverName, 
      contactNo, 
      route, 
      contactNumber,
      startingLocation,
      endingLocation,
      waypoints,
      schedule
    } = req.body;

    console.log('Update received data:', req.body); // Debug log

    // Prepare update data with proper structure
    const updateData = {
      vehicleNo: vehicleNo,
      driverName: driverName,
      contactNo: contactNo || contactNumber,
      contactNumber: contactNumber || contactNo,
      route: route || 'Not specified'
    };

    // Only add location fields if they exist and have valid data
    if (startingLocation && startingLocation.name && startingLocation.name.trim() !== '') {
      updateData.startingLocation = {
        name: startingLocation.name,
        coordinates: {
          lat: startingLocation.coordinates?.lat || 0,
          lng: startingLocation.coordinates?.lng || 0
        }
      };
    }

    if (endingLocation && endingLocation.name && endingLocation.name.trim() !== '') {
      updateData.endingLocation = {
        name: endingLocation.name,
        coordinates: {
          lat: endingLocation.coordinates?.lat || 0,
          lng: endingLocation.coordinates?.lng || 0
        }
      };
    }

    // Only add waypoints if they exist
    if (waypoints && waypoints.length > 0) {
      updateData.waypoints = waypoints;
    }

    // Only add schedule if it has valid data
    if (schedule && schedule.startTime && schedule.startTime.trim() !== '') {
      updateData.schedule = {
        startTime: schedule.startTime,
        frequency: schedule.frequency || 'Daily'
      };
    }

    console.log('Update mapped data:', updateData); // Debug log

    const updated = await Shuttle.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    
    if (!updated) return res.status(404).json({ message: "Shuttle not found" });
    
    console.log('Updated shuttle:', updated); // Debug log
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating shuttle:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE shuttle
exports.deleteShuttle = async (req, res) => {
  try {
    const deleted = await Shuttle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Shuttle not found" });
    res.status(200).json({ message: "Shuttle deleted" });
  } catch (err) {
    console.error("Error deleting shuttle:", err);
    res.status(500).json({ message: "Server error" });
  }
};
