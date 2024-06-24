const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authToken = require("../middlewares/authenticateToken");

// Create a new Admin
router.post("/", adminController.create);

// Retrieve all Admins - Assuming this is protected
router.get("/", authToken, adminController.findAll);

// Retrieve a single Admin by id - This could be protected or public based on your application's needs
router.get("/:adId", authToken, adminController.findOne);

// Update an Admin by id - Protected
router.put("/:adId", authToken, adminController.update);

// Delete an Admin by id - Protected
router.delete("/:adId", authToken, adminController.delete);

// Login API - Publicly accessible, does not require authToken middleware
router.post("/login", adminController.Login);

module.exports = router;
