const express = require("express");
const router = express.Router();
const shuttleController = require("../Controllers/shuttleController");

// CRUD Routes
router.get("/", shuttleController.getAllShuttles);
router.get("/:id", shuttleController.getById);
router.post("/", shuttleController.addShuttle);
router.put("/:id", shuttleController.updateShuttle);
router.delete("/:id", shuttleController.deleteShuttle);

module.exports = router;
