const express = require("express");
const router = express.Router();
const usrSubsController = require("../controllers/UserSubscription.controller");
const authToken = require("../middlewares/authenticateToken");

router.post("/", authToken, usrSubsController.create);
router.get("/", authToken, usrSubsController.findAll);
router.get("/:id", authToken, usrSubsController.findOne);
router.put("/:id", authToken, usrSubsController.update);
router.delete("/:id", authToken, usrSubsController.delete);

module.exports = router;
