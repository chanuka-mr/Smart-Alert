//username = Admin
//pass = n3AK0A9ujJWgb9dD

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const router= require("./Routes/ExamRoutes");
const timeTableRouter = require("./Routes/TimeTableRoutes");
const reportCardRouter = require("./Routes/ReportCardRoutes");

const app = express();

//Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use("/exams",router);
app.use("/timetable", timeTableRouter);
app.use("/reportcard", reportCardRouter);



mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/suduni")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
})
.catch((err) => console.log((err)));