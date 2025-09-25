const { User } = require('../Model/userModel');

const generateUserID = async (role) => {
  try {
    // Get the last 2 digits of current year
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    // Define role prefix
    const rolePrefixes = {
      'Admin': 'A',
      'Parent': 'S',
      'Teacher': 'T',
      'ShuttleStaff': 'D'
    };
    
    const prefix = rolePrefixes[role];
    if (!prefix) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    // Create the base pattern for this year and role
    const basePattern = `${prefix}${yearSuffix}`;
    
    // Find the highest existing userID for this role and year
    const existingUsers = await User.find({
      userID: { $regex: `^${basePattern}` }
    }).sort({ userID: -1 }).limit(1);
    
    let sequenceNumber = 1;
    
    if (existingUsers.length > 0) {
      // Extract the sequence number from the last userID
      const lastUserID = existingUsers[0].userID;
      const lastSequence = parseInt(lastUserID.replace(basePattern, ''));
      
      if (!isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }
    
    // Format the sequence number with leading zeros (4 digits)
    const formattedSequence = sequenceNumber.toString().padStart(4, '0');
    
    // Generate the final userID
    const userID = `${basePattern}${formattedSequence}`;
    
    // Double-check that this userID doesn't already exist (safety check)
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      // If it exists, try the next number
      return await generateUserID(role);
    }
    
    return userID;
  } catch (error) {
    console.error('Error generating userID:', error);
    throw error;
  }
};

/**
 * Generate userID for a specific year (useful for testing or historical data)
 */
const generateUserIDForYear = async (role, year) => {
  try {
    const yearSuffix = year.toString().slice(-2);
    
    const rolePrefixes = {
      'Admin': 'A',
      'Parent': 'S',
      'Teacher': 'T',
      'ShuttleStaff': 'D'
    };
    
    const prefix = rolePrefixes[role];
    if (!prefix) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    const basePattern = `${prefix}${yearSuffix}`;
    
    const existingUsers = await User.find({
      userID: { $regex: `^${basePattern}` }
    }).sort({ userID: -1 }).limit(1);
    
    let sequenceNumber = 1;
    
    if (existingUsers.length > 0) {
      const lastUserID = existingUsers[0].userID;
      const lastSequence = parseInt(lastUserID.replace(basePattern, ''));
      
      if (!isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }
    
    const formattedSequence = sequenceNumber.toString().padStart(4, '0');
    const userID = `${basePattern}${formattedSequence}`;
    
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      return await generateUserIDForYear(role, year);
    }
    
    return userID;
  } catch (error) {
    console.error('Error generating userID for year:', error);
    throw error;
  }
};

module.exports = {
  generateUserID,
  generateUserIDForYear
};
