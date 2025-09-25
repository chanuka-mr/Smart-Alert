// app.js
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

// Routes
const userRoutes = require("./Routes/userRoutes");
const authRoutes = require("./Routes/authRoutes");
const featureRoutes = require("./Routes/featureRoutes");
const academicRoutes = require("./Routes/academicRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

// Middleware
app.use(express.json()); // parse JSON bodies

// Mount routes
app.use("/users", userRoutes); // protected CRUD routes
app.use("/auth", authRoutes);  // login/otp routes
app.use("/features", featureRoutes); // features CRUD routes
app.use("/academic", academicRoutes); // academic information routes

// Read from .env with safe fallbacks
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/smart-alert-db";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));
