const { Parent } = require("../Model/userModel");
const { User } = require("../Model/userModel");
const activityController = require("./activityController");

// Create parent details
const createParentDetails = async (req, res) => {
  try {
    const { userID, parentName, contactNumber, whatsappNumber } = req.body;
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';

    console.log('Creating parent details:', { userID, parentName, contactNumber, whatsappNumber, adminId });

    // Check if user exists and is a Parent
    const user = await User.findOne({ userID });
    if (!user) {
      console.log('User not found:', userID);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'Parent') {
      return res.status(400).json({ 
        message: "Parent details can only be assigned to Parent role users" 
      });
    }

    // Check if parent details already exist
    const existingParent = await Parent.findOne({ userID });
    if (existingParent) {
      console.log('Parent details already exist for user:', userID);
      return res.status(400).json({ 
        message: "Parent details already exist for this user" 
      });
    }

    const parentDetails = new Parent({
      userID,
      parentName,
      contactNumber,
      whatsappNumber
    });

    console.log('Creating parent record:', parentDetails);
    await parentDetails.save();
    console.log('Parent record saved successfully:', parentDetails);

    // Log activity
    await activityController.logActivity(
      adminId,
      adminName,
      'parent_details_created',
      'parent',
      parentDetails._id.toString(),
      parentName,
      `Created parent details for user: ${user.fullName} (${userID})`,
      { userID, parentName, contactNumber, whatsappNumber },
      req
    );

    return res.status(201).json({ 
      message: "Parent details created successfully", 
      parentDetails 
    });
  } catch (err) {
    console.error('Error creating parent details:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get parent details by userID
const getParentDetails = async (req, res) => {
  try {
    const { userID } = req.params;
    
    console.log('Getting parent details for userID:', userID);
    
    const parentDetails = await Parent.findOne({ userID });
    
    if (!parentDetails) {
      console.log('No parent details found for userID:', userID);
      return res.status(404).json({ message: "Parent details not found" });
    }

    console.log('Parent details found:', parentDetails);
    return res.status(200).json({ parentDetails });
  } catch (err) {
    console.error('Error getting parent details:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update parent details
const updateParentDetails = async (req, res) => {
  try {
    const { userID } = req.params;
    const updateData = req.body;
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';

    console.log('Updating parent details for userID:', userID, 'Data:', updateData);

    // Check if user exists and is a Parent
    const user = await User.findOne({ userID });
    if (!user) {
      console.log('User not found:', userID);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'Parent') {
      return res.status(400).json({ 
        message: "Parent details can only be updated for Parent role users" 
      });
    }

    const parentDetails = await Parent.findOneAndUpdate(
      { userID },
      updateData,
      { new: true, runValidators: true }
    );

    if (!parentDetails) {
      console.log('Parent details not found for userID:', userID);
      return res.status(404).json({ message: "Parent details not found" });
    }

    console.log('Parent details updated successfully:', parentDetails);

    // Log activity
    await activityController.logActivity(
      adminId,
      adminName,
      'parent_details_updated',
      'parent',
      parentDetails._id.toString(),
      parentDetails.parentName,
      `Updated parent details for user: ${user.fullName} (${userID})`,
      { userID, changes: updateData },
      req
    );

    return res.status(200).json({ 
      message: "Parent details updated successfully", 
      parentDetails 
    });
  } catch (err) {
    console.error('Error updating parent details:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete parent details
const deleteParentDetails = async (req, res) => {
  try {
    const { userID } = req.params;
    const adminId = req.user?.id || 'unknown';
    const adminName = req.user?.name || 'Unknown Admin';

    console.log('Deleting parent details for userID:', userID);

    const parentDetails = await Parent.findOneAndDelete({ userID });

    if (!parentDetails) {
      console.log('Parent details not found for userID:', userID);
      return res.status(404).json({ message: "Parent details not found" });
    }

    console.log('Parent details deleted successfully:', parentDetails);

    // Log activity
    await activityController.logActivity(
      adminId,
      adminName,
      'parent_details_deleted',
      'parent',
      parentDetails._id.toString(),
      parentDetails.parentName,
      `Deleted parent details for user: ${userID}`,
      { userID },
      req
    );

    return res.status(200).json({ 
      message: "Parent details deleted successfully" 
    });
  } catch (err) {
    console.error('Error deleting parent details:', err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createParentDetails,
  getParentDetails,
  updateParentDetails,
  deleteParentDetails
};
