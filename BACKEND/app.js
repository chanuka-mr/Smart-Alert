const express = require("express");
const mongoose = require("mongoose");
const studentRoutes = require("./Routes/StudentRoutes");
const attendanceRoutes = require("./Routes/AttendanceRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use("/students", studentRoutes);
app.use("/attendance", attendanceRoutes);


mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5002, () => console.log("Server running on port 5002"));
})
.catch((err) => console.log(err.message));