// Main backend entry point for Smart-Alert

// Import required modules
const express = require("express"); // Express web framework
const mongoose = require("mongoose"); // MongoDB ODM
const noticeRouter = require("./Routes/NoticeRoutes"); // Notice routes
const chatRouter = require("./Routes/ChatRoutes"); // Chat routes

const app = express(); // Create Express app

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use('/uploads', express.static(__dirname + '/uploads')); // Serve uploaded files statically
app.use("/notices", noticeRouter); // Mount notice routes
app.use("/chat", chatRouter); // Mount chat routes

// Connect to MongoDB database and start server
mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/Notices")
    .then(() => console.log("Connected to MongoDB"))
    .then(() => {
        app.listen(5000); // Start server on port 5000
    })
    .catch((err) => console.log((err)));