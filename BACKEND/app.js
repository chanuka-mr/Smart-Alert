// Main backend entry point for Smart-Alert
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

// Routes
const userRoutes = require("./Routes/userRoutes");
const authRoutes = require("./Routes/authRoutes");
const featureRoutes = require("./Routes/featureRoutes");
const academicRoutes = require("./Routes/academicRoutes");
const activityRoutes = require("./Routes/activityRoutes");
const parentRoutes = require("./Routes/parentRoutes");
const noticeRouter = require("./Routes/NoticeRoutes");
const chatRouter = require("./Routes/ChatRoutes");
const examRouter = require("./Routes/ExamRoutes");
const timeTableRouter = require("./Routes/TimeTableRoutes");
const reportCardRouter = require("./Routes/ReportCardRoutes");
const driverRoutes = require("./Routes/driverRoutes");
const shuttleRoutes = require("./Routes/shuttleRoute");
const studentRoutes = require("./Routes/studentRoutes");
const locationRoutes = require("./Routes/locationRoutes");
const attendanceRoutes = require("./Routes/AttendanceRoutes");
const reportRoutes = require("./Routes/ReportRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Allow multiple origins for CORS
app.use(cors({ 
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use('/uploads', express.static(__dirname + '/uploads')); // Serve uploaded files statically

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Add io to request object for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount routes
app.use("/users", userRoutes); // protected CRUD routes
app.use("/auth", authRoutes);  // login/otp routes
app.use("/features", featureRoutes); // features CRUD routes
app.use("/academic", academicRoutes); // academic information routes
app.use("/activities", activityRoutes); // activity logging routes
app.use("/parents", parentRoutes); // parent details routes
app.use("/notices", noticeRouter); // Mount notice routes
app.use("/chat", chatRouter); // Mount chat routes
app.use("/exams", examRouter); // Mount exam routes
app.use("/timetable", timeTableRouter); // Mount timetable routes
app.use("/reportcard", reportCardRouter); // Mount report card routes
app.use("/api/drivers", driverRoutes); // Mount driver routes
app.use("/api/shuttles", shuttleRoutes); // Mount shuttle routes
app.use("/api/students", studentRoutes); // Mount student routes
app.use("/api/locations", locationRoutes); // Mount location routes
app.use("/attendance", attendanceRoutes); // Mount attendance routes
app.use("/reports", reportRoutes); // Mount report routes

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

    // Start server. By default the server will try to auto-increment if the
    // desired port is busy (existing behavior). If STRICT_PORT=true is set in
    // the environment, the server will fail fast instead to enforce a fixed
    // port for development (so CRA proxy and other tooling have a stable target).
    let currentPort = Number(PORT);
    const maxRetries = 10;
    let attempts = 0;

    const startListening = () => {
      server.listen(currentPort, () => {
        console.log(`Server running on http://localhost:${currentPort}`);
        console.log("Socket.IO enabled for real-time tracking");
      });
    };

    const strictPort = String(process.env.STRICT_PORT).toLowerCase() === 'true';

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        if (strictPort) {
          console.error(`Port ${currentPort} already in use and STRICT_PORT=true. Exiting.`);
          process.exit(1);
        }

        if (attempts < maxRetries) {
          attempts += 1;
          const nextPort = currentPort + 1;
          console.warn(`Port ${currentPort} in use. Retrying on ${nextPort} (attempt ${attempts}/${maxRetries})...`);
          currentPort = nextPort;
          setTimeout(() => {
            try {
              server.close(() => startListening());
            } catch (_) {
              startListening();
            }
          }, 500);
          return;
        }
      }

      console.error('Server failed to start:', err);
      process.exit(1);
    });

    startListening();
  })
  .catch((err) => console.log(err));

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


