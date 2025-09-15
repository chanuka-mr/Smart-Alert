const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({

    name:{
        type:String,//data type
        required:true,//validate
    },
    phone:{
        type:String,//data type
        required:true,//validate
    },
    NIC:{
        type:String,
        required:true,
    },
     licenNumber:{
        type:String,//data type
        required:true,//validate
    }

});

module.exports = mongoose.model(
    "driverModel",//file name
    driverSchema //function name
)