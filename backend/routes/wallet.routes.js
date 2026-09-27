const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const walletController = require("../controllers/wallet.controller");

// Get complete wallet
router.get("/", auth, walletController.getWallet);

// Get wallet balance
router.get("/balance", auth, walletController.getBalance);

module.exports = router;
