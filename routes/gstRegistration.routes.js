const express = require("express");
const router = express.Router();
const gstRegistrationController = require("../controllers/gstregistration.controller");

router.post("/", gstRegistrationController.create);
router.get("/", gstRegistrationController.findAll);
router.get("/:id", gstRegistrationController.findOne);
router.put("/:id", gstRegistrationController.update);
router.delete("/:id", gstRegistrationController.delete);

module.exports = router;
