const express = require ("express");
const router = express.Router();
const Notice = require("../Model/NoticeModel");
const NoticeController = require("../Controllers/NoticeControllers");

router.get("/",NoticeController.getAllNotice);
router.post("/",NoticeController.addNotice);
router.get("/:id",NoticeController.getById);
router.put("/:id",NoticeController.updateNotice);
router.delete("/:id",NoticeController.deletenotice);

//export
module.exports = router;