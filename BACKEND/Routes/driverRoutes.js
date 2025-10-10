const express = require("express");
const router = express.Router();

//insert User Controller
const driverController = require("../Controllers/driverController");

// GET /drivers
router.get("/", driverController.getAllDrivers);
router.get("/:id", driverController.getById);
router.post("/", driverController.addDrivers);
router.put("/:id", driverController.updateDriver);
router.delete("/:id", driverController.deleteDriver);



module.exports = router;

