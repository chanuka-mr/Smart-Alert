const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Middleware/auth");
const ParentController = require("../Controllers/parentController");

// Admin-only routes
router.post("/", verifyToken, verifyAdmin, ParentController.createParentDetails);
router.get("/:userID", verifyToken, ParentController.getParentDetails);
router.put("/:userID", verifyToken, verifyAdmin, ParentController.updateParentDetails);
router.delete("/:userID", verifyToken, verifyAdmin, ParentController.deleteParentDetails);

module.exports = router;
