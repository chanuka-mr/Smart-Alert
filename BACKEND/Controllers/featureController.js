const Feature = require("../Model/featureModel");

// Get all features
const getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find().sort({ createdAt: -1 });
    return res.status(200).json({ features });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feature by ID
const getFeatureById = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }
    return res.status(200).json({ feature });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new feature (Admin only)
const createFeature = async (req, res) => {
  try {
    const { title, description, icon } = req.body;
    
    if (!title || !description || !icon) {
      return res.status(400).json({ message: "Title, description, and icon are required" });
    }

    const feature = new Feature({ title, description, icon });
    await feature.save();
    
    return res.status(201).json({ 
      message: "Feature created successfully", 
      feature 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update feature (Admin only)
const updateFeature = async (req, res) => {
  try {
    const { title, description, icon } = req.body;
    const featureId = req.params.id;

    if (!title || !description || !icon) {
      return res.status(400).json({ message: "Title, description, and icon are required" });
    }

    const feature = await Feature.findByIdAndUpdate(
      featureId,
      { title, description, icon },
      { new: true, runValidators: true }
    );

    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    return res.status(200).json({ 
      message: "Feature updated successfully", 
      feature 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete feature (Admin only)
const deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByIdAndDelete(req.params.id);
    
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    return res.status(200).json({ 
      message: "Feature deleted successfully", 
      feature 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature
};

