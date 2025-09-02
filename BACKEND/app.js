// app.js
const express = require("express");
const mongoose = require("mongoose");

// Routes
const userRoutes = require("./Routes/userRoutes");
const authRoutes = require("./Routes/authRoutes");

const app = express();

// Middleware
app.use(express.json()); // parse JSON bodies

// Mount routes
app.use("/users", userRoutes); // protected CRUD routes
app.use("/auth", authRoutes);  // login route

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/yourDBName"
  )
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((err) => console.log(err));
