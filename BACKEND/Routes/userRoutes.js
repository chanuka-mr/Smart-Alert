const express = require("express");
const router = express.Router();

//insert model and controller
const UserController = require("../Controllers/userControllers");

router.get("/", UserController.getAllUsers);
router.post("/", UserController.createUser);
router.get("/:id", UserController.getById);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

//export
module.exports = router;