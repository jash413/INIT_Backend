const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription.controller");
const authToken = require("../middlewares/authenticateToken");

router.post("/", authToken, subscriptionController.create); // Create a new subscription
router.get("/", authToken, subscriptionController.findAll); // Retrieve all subscriptions
router.get("/:subId", authToken, subscriptionController.findOne); // Find a subscription by id
router.put("/:subCode", authToken, subscriptionController.update);// Update a subscription by id
router.delete("/:subId", authToken, subscriptionController.delete); // Delete a subscription by id

module.exports = router;
