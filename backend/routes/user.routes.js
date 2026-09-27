const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const userController = require("../controllers/user.controller");

// Get logged-in user's profile
router.get("/profile", auth, userController.getProfile);

// Update logged-in user's profile
router.put("/profile", auth, userController.updateProfile);

module.exports = router;
