const express = require("express");
const router = express.Router();
const {verifyToken, verifyAdmin} = require("../Middleware/auth");

//insert controller
const UserController = require("../Controllers/userControllers");

router.get("/", verifyToken, verifyAdmin, UserController.getAllUsers);
router.post("/", verifyToken, verifyAdmin, UserController.createUser);
router.get("/:id", verifyToken, verifyAdmin, UserController.getById);
router.put("/:id", verifyToken, verifyAdmin, UserController.updateUser);
router.delete("/:id", verifyToken, verifyAdmin, UserController.deleteUser);

//export
module.exports = router;