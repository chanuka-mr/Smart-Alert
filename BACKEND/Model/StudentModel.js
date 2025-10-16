/**
 * ⚠️ DEPRECATED - This model is no longer used
 * 
 * Students are now represented as Users with role="Parent" in the User model.
 * 
 * Related models:
 * - User (userModel.js) - Main user data with role="Parent" for students
 * - Academic (userModel.js) - Grade and class information
 * - Parent (userModel.js) - Parent contact details
 * 
 * Migration notes:
 * - Student name → User.fullName
 * - Student std_index → User.userID
 * - Student section → Academic.grade + Academic.class (e.g., "5A")
 * - Student parentName → Parent.parentName
 * - Student parentPhoneNum → Parent.whatsappNumber
 * 
 * This file is kept for reference only and should not be used in new code.
 * To completely remove this model, ensure all old StudentModel documents
 * have been migrated to the User/Academic/Parent structure.
 */

const mongoose = require("mongoose");

// Export a dummy model to prevent errors if accidentally imported
module.exports = {
  find: () => {
    throw new Error("StudentModel is deprecated. Use User model with role='Parent' instead.");
  },
  findById: () => {
    throw new Error("StudentModel is deprecated. Use User model with role='Parent' instead.");
  },
  findOne: () => {
    throw new Error("StudentModel is deprecated. Use User model with role='Parent' instead.");
  }
};


