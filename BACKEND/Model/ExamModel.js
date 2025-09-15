const mongoose = require("mogoose");
const Schema = mongoose.Schema;

//create a function for calling input
const examSchema = new Schema({
    subject:{
        type:String,//data type
        required:true,//validate
    },
    marks:{
        type:Number,//data type
        required:true,//validate
    },
    grade:{
        type:String,//data type
        required:true,//validate
    },
     




})