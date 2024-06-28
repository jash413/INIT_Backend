
const express = require("express");
const router = express.Router();
const subplancontroller = require("../controllers/subplan.controller");
const authToken = require("../middlewares/authenticateToken");

router.get("/", authToken, subplancontroller.findAll); // Retrieve all Plans

module.exports = router;