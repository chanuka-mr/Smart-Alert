const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    std_index: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    bday: {
        type: Date,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Admin", "Teacher", "Parent", "ShuttleStaff"],
        required: true
    }
});

module.exports = mongoose.model("User", userSchema);
