const express = require("express");
const mongoose = require("mongoose");
const studentRoutes = require("./Routes/StudentRoutes");
const attendanceRoutes = require("./Routes/AttendanceRoutes");
const cors = require("cors");
require("dotenv").config(); // Add this line
const app = express();

//  Apply middleware BEFORE routes
app.use(cors({ origin: "http://localhost:3000" })); // allow your frontend
app.use(express.json());

// Mount routes after middleware
app.use("/students", studentRoutes);
app.use("/attendance", attendanceRoutes);

//Connect to MongoDB and start server
mongoose
  .connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/")
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5002, () => console.log("Server running on port 5002"));
  })
  .catch((err) => console.log(err.message));