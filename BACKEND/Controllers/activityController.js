const Activity = require("../Model/activityModel");

// Log an activity
const logActivity = async (adminId, adminName, action, targetType, targetId, targetName, description, details = {}, req = null) => {
  try {
    const activity = new Activity({
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      description,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent')
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

// Get activities for a specific admin
const getAdminActivities = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await Activity.countDocuments({ adminId });
    
    res.status(200).json({
      activities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Failed to get admin activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent activities for dashboard
const getRecentActivities = async (req, res) => {
  try {
    const { adminId } = req.params;
    const limit = 5;
    
    const activities = await Activity.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Format activities for dashboard display
    const formattedActivities = activities.map(activity => {
      const timeAgo = getTimeAgo(activity.createdAt);
      
      return {
        id: activity._id,
        type: getActivityIcon(activity.action),
        title: getActivityTitle(activity.action),
        description: activity.description,
        time: timeAgo,
        details: activity.details
      };
    });
    
    res.status(200).json({ activities: formattedActivities });
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Helper function to get activity icon
const getActivityIcon = (action) => {
  const iconMap = {
    'user_created': 'user-plus',
    'user_updated': 'user-edit',
    'user_deleted': 'user-minus',
    'user_viewed': 'user',
    'login': 'sign-in-alt',
    'logout': 'sign-out-alt',
    'dashboard_viewed': 'tachometer-alt',
    'profile_viewed': 'user-circle'
  };
  return iconMap[action] || 'info-circle';
};

// Helper function to get activity title
const getActivityTitle = (action) => {
  const titleMap = {
    'user_created': 'User Created',
    'user_updated': 'User Updated',
    'user_deleted': 'User Deleted',
    'user_viewed': 'User Viewed',
    'login': 'Login',
    'logout': 'Logout',
    'dashboard_viewed': 'Dashboard Accessed',
    'profile_viewed': 'Profile Viewed'
  };
  return titleMap[action] || 'Activity';
};

module.exports = { 
  logActivity, 
  getAdminActivities, 
  getRecentActivities 
};
