const express = require("express");
const router = express.Router();
const activityController = require("../Controllers/activityController");
const auth = require("../Middleware/auth");

// Get activities for a specific admin
router.get("/admin/:adminId", auth.verifyToken, activityController.getAdminActivities);

// Get recent activities for dashboard
router.get("/recent/:adminId", auth.verifyToken, activityController.getRecentActivities);

// Log activity (for frontend to call)
router.post("/log", auth.verifyToken, async (req, res) => {
  try {
    const { action, targetType, targetId, targetName, description, details } = req.body;
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';
    
    await activityController.logActivity(
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      description,
      details,
      req
    );
    
    res.status(200).json({ message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Failed to log activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
