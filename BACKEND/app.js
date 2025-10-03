const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

//Import routes
const driverRoutes = require("./Routes/driverRoutes");
const shuttleRoutes = require("./Routes/shuttleRoute");
const studentRoutes = require("./Routes/studentRoutes");
const locationRoutes = require("./Routes/locationRoutes");


//Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json()); // parses application/json
app.use(express.urlencoded({ extended: true })); // parses form data

//Use routes
app.use("/api/drivers", driverRoutes);
app.use("/api/shuttles", shuttleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/locations", locationRoutes);

// Add io to request object for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});


const dbURI =process.env.MONGODB_URI || "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/smart-alert-db?retryWrites=true&w=majority";

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000; // use 5000 if process.env.PORT is undefined

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("MongoDB connected");
      console.log("Socket.IO enabled for real-time tracking");
    });
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinTracking', (data) => {
    socket.join(`shuttle-${data.shuttleId}`);
    console.log(`Client ${socket.id} joined tracking for shuttle ${data.shuttleId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
