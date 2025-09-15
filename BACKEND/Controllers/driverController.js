const User = require("../Model/driverModel");

const getAllDrivers = async(req, res, next) =>{ 
let Drivers;
 //Get all users
 try{
     Drivers = await Drivers.find();

 }catch(err){
     console.log(err);
 }
 //not found
     if(!Drivers){
        return res.status(404).json({message:"User not found"});
    }
    //Display all users
    return res.status(200).json({ Drivers });
};

exports.getAllDrivers = getAllDrivers;