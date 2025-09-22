//username = Admin
//pass = n3AK0A9ujJWgb9dD

const express = require("express");
const mongoose = require("mongoose");
const noticeRouter = require("./Routes/NoticeRoutes");
const chatRouter = require("./Routes/ChatRoutes");

const app = express();

//Middleware
app.use(express.json());
app.use("/notices",noticeRouter);
app.use("/chat", chatRouter);

mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/Notices")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000);
})
.catch((err) => console.log((err)));