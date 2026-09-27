const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Current logged-in user
router.get("/me", auth, authController.me);

module.exports = router;
