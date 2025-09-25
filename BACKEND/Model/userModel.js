const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

/* ==============================
   Login Schema
   Stores authentication details
   ============================== */
const loginSchema = new Schema({
    userID: { // must match User.userID
        type: String,
        required: true,
        unique: true
    },
    username: { // email or userID
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    isVerified: { 
        type: Boolean,
        default: false
    },
    otp: { 
        type: String
    },
    otpExpiry: { 
        type: Date
    }
}, { timestamps: true });

// Hash password before saving
loginSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare raw password with hashed password
loginSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

/* ==============================
   User Profile Schema
   Stores general information
   ============================== */
const userSchema = new Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    birthday: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email: { 
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["Admin", "Teacher", "Parent", "ShuttleStaff"],
        required: true
    }
}, { timestamps: true });

// Virtual field to calculate age from birthday
userSchema.virtual("age").get(function () {
    if (!this.birthday) return null;
    const today = new Date();
    let age = today.getFullYear() - this.birthday.getFullYear();
    const monthDiff = today.getMonth() - this.birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthday.getDate())) {
        age--;
    }
    return age;
});

/* ==============================
   Academic Schema
   Stores grade and class for parents and teachers
   ============================== */
const academicSchema = new Schema({
    userID: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },
    grade: {
        type: Number,
        required: true,
        min: 1,
        max: 11
    },
    class: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C'],
        uppercase: true
    },
    assignedBy: {
        type: String,
        required: true,
        ref: 'User'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
academicSchema.index({ grade: 1, class: 1 });

// Export all models
module.exports = {
    User: mongoose.model("User", userSchema),
    Login: mongoose.model("Login", loginSchema),
    Academic: mongoose.model("Academic", academicSchema)
};
