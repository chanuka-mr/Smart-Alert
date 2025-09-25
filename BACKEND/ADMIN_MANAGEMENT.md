# Admin Management Tools

This directory contains several tools for managing admin users in the Smart Alert system.

## 📁 Files Overview

### 1. `seedAdmin.js` - Standard Admin Seeding
**Purpose**: Creates a new admin user if none exists.

**Usage**:
```bash
node seedAdmin.js
```

**Features**:
- ✅ Checks if admin already exists
- ✅ Generates automatic userID (A250001, A250002, etc.)
- ✅ Creates user profile and login credentials
- ✅ Prevents duplicate admin creation
- ✅ Provides clear success/error messages

**Default Admin Details**:
- **UserID**: Auto-generated (A250001, A250002, etc.)
- **Full Name**: Chanakya Admin
- **Email**: jchanukamr@gmail.com
- **Password**: admin123
- **Role**: Admin
- **Status**: Verified

---

### 2. `seedAdminForce.js` - Force Admin Seeding
**Purpose**: Creates a new admin user, replacing any existing admin.

**Usage**:
```bash
node seedAdminForce.js
```

**Features**:
- ⚠️ Deletes existing admin if found
- ✅ Generates new userID
- ✅ Creates fresh admin user
- ✅ Useful for resetting admin credentials

---

### 3. `adminManager.js` - Comprehensive Admin Management
**Purpose**: Full-featured admin user management tool.

**Usage**:
```bash
# List all admin users
node adminManager.js list

# Create new admin (if none exists)
node adminManager.js create

# Force create admin (replace existing)
node adminManager.js force

# Delete specific admin
node adminManager.js delete A250001

# Show help
node adminManager.js help
```

**Features**:
- 📋 List all admin users with details
- ➕ Create new admin users
- 🔄 Force replace existing admin
- 🗑️ Delete specific admin by userID
- ❓ Help and usage guide
- 📊 Detailed user information display

---

## 🔧 UserID Generation System

All admin users are created with automatic userID generation:

### Format: `A[YY][NNNN]`
- **A**: Admin role prefix
- **YY**: Last 2 digits of current year (25 for 2025)
- **NNNN**: 4-digit sequential number (0001, 0002, etc.)

### Examples:
- **A250001**: First admin created in 2025
- **A250002**: Second admin created in 2025
- **A260001**: First admin created in 2026

---

## 🚀 Quick Start

### First Time Setup:
```bash
# Create the first admin user
node seedAdmin.js
```

### Reset Admin Credentials:
```bash
# Force create new admin (replaces existing)
node seedAdminForce.js
```

### Manage Existing Admins:
```bash
# List all admins
node adminManager.js list

# Delete specific admin
node adminManager.js delete A250001
```

---

## 🔐 Security Notes

1. **Default Password**: All seeded admins use `admin123` as the default password
2. **Password Change**: Admins should change their password after first login
3. **Multiple Admins**: The system supports multiple admin users
4. **UserID Uniqueness**: Each admin gets a unique, auto-generated userID

---

## 🐛 Troubleshooting

### "Admin already exists" Error:
- Use `seedAdminForce.js` to replace existing admin
- Or use `adminManager.js delete <userID>` to remove specific admin

### "Invalid credentials" Login Error:
- Ensure the backend server is running
- Check that the admin user exists in the database
- Verify the userID and password are correct

### Database Connection Issues:
- Check MongoDB connection string in the scripts
- Ensure MongoDB Atlas cluster is accessible
- Verify network connectivity

---

## 📝 Logs and Output

All scripts provide detailed console output:
- ✅ Success messages (green checkmarks)
- ❌ Error messages (red X marks)
- ⚠️ Warning messages (yellow exclamation marks)
- ℹ️ Information messages (blue info marks)
- 📋 Data listings and details

---

## 🔄 Integration with Frontend

The admin users created by these scripts are immediately available in:
- **Admin Dashboard**: Full user management interface
- **Login System**: Can login with generated credentials
- **User Management**: Can be managed through the web interface

---

## 📞 Support

If you encounter any issues:
1. Check the console output for error messages
2. Verify MongoDB connection
3. Ensure backend server is running
4. Check userID and password format
