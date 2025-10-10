const Driver = require("../Model/driverModel");


// GET /drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json(drivers);//always return array
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create driver
const addDrivers = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : req.body.name;
    // accept aliases from client (licenseNo, nicNo, phoneNo)
    const licenseRaw = req.body.licenseNumber || req.body.licenseNo;
    const nicRaw = req.body.nicNumber || req.body.nicNo;
    const phoneRaw = req.body.phoneNumber || req.body.phoneNo;
    const licenseNumber = typeof licenseRaw === "string" ? licenseRaw.trim() : licenseRaw;
    const nicNumber = typeof nicRaw === "string" ? nicRaw.trim() : nicRaw;
    const phoneNumber = typeof phoneRaw === "string" ? phoneRaw.trim() : phoneRaw;

    if (!name) return res.status(400).json({ message: "name is required" });
    if (!licenseNumber) return res.status(400).json({ message: "licenseNumber is required" });
    if (!nicNumber) return res.status(400).json({ message: "nicNumber is required" });
    if (!phoneNumber) return res.status(400).json({ message: "phoneNumber is required" });
    
// NIC validation
    const nicRegex = /^\d{13}$/;
    if (!nicRegex.test(nicNumber)) {
      return res.status(400).json({
        message: "nicNumber must be exactly 13 digits ",
      });
    }

    // License validation
    const licenseRegex = /^(?=.*[A-Za-z])[A-Za-z0-9]{10}$/;
    if (!licenseRegex.test(licenseNumber)) {
      return res.status(400).json({
        message: "licenseNumber must be 10 characters with 1 letter and 9 digits"
      });
    }
     const phoneRegex = /^\d{1,10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "phoneNumber must be digits only and maximum 10 digits",
      });
    }
    const driver = new Driver({
      name,
      licenseNumber,
      nicNumber,
      phoneNumber,
      emergencyContact: req.body.emergencyContact,
      isActive: req.body.isActive,
      availabilityStatus: req.body.availabilityStatus,
      backgroundCheckStatus: req.body.backgroundCheckStatus,
      trainingCompleted: req.body.trainingCompleted,
      ratings: req.body.ratings,
      profileImageUrl: req.body.profileImageUrl,
    });

    const saved = await driver.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error adding driver:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Driver with this NIC or License already exists", keyValue: err.keyValue });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};
//Get by Id

const getById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    return res.status(200).json(driver);
  } catch (err) {
    console.error("Error fetching driver by ID:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
//update user details
const updateDriver = async(req, res, next)=>{

    const id = req.params.id;

  try {
    const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, {
      new: true, // return updated document
      runValidators: true, // ensure schema validation
    });

    if (!updatedDriver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.status(200).json(updatedDriver);
  } catch (err) {
    console.error("Error updating driver:", err);
    res.status(500).json({ message: "Server error" });
  }
}

//Delete user details
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    return res.status(200).json({ message: "Driver deleted" });
  } catch (err) {
    console.error("Error deleting driver:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.getAllDrivers = getAllDrivers;
exports.addDrivers = addDrivers;
exports.getById = getById;
exports.updateDriver = updateDriver;
exports.deleteDriver = deleteDriver;