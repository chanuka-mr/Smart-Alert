//username = Admin
//pass = n3AK0A9ujJWgb9dD

const express = require("express");
const mongoose = require("mongoose");
const router= require("./Routes/ExamRoutes");
const timeTableRouter = require("./Routes/TimeTableRoutes");

const app = express();

//Middleware

app.use(express.json());
app.use("/exams",router);
app.use("/timetable", timeTableRouter);



mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.3km1y3r.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000);
})
.catch((err) => console.log((err)));