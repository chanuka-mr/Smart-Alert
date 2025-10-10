<<<<<<< Updated upstream
const express = require("express");
const mongoose = require("mongoose");
const studentRoutes = require("./Routes/StudentRoutes");
const attendanceRoutes = require("./Routes/AttendanceRoutes");
const reportRoutes = require("./Routes/ReportRoutes");
const cors = require("cors");
require("dotenv").config(); // Add this line
=======

const express = require("express");           
const mongoose = require("mongoose");        
const studentRoutes = require("./Routes/StudentRoutes");      
const attendanceRoutes = require("./Routes/AttendanceRoutes"); 
const cors = require("cors");                
require("dotenv").config();                  


>>>>>>> Stashed changes
const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use("/students", studentRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/reports", reportRoutes);


mongoose
<<<<<<< Updated upstream
  .connect(process.env.MONGODB_URI || "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/")
  .then(() => console.log("Connected to MongoDB"))
=======
  .connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/")
  .then(() => console.log("Connected to MongoDB")) 
>>>>>>> Stashed changes
  .then(() => {
    // Start the server on port 5002 after successful database connection
    app.listen(5002, () => console.log("Server running on port 5002"));
  })
  .catch((err) => console.log(err.message));  