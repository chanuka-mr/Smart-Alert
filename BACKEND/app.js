//username = Admin
//pass = n3AK0A9ujJWgb9dD

const express = require("express");
const mongoose = require("mongoose");
const router = require("./Routes/userRoutes")

const app = express();

//Middleware
app.use(express.json());
app.use("/users", router);

mongoose.connect("mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000);
})
.catch((err) => console.log((err)));
