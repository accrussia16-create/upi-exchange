const db = require("../config/database");

// =========================
// GET WALLET
// =========================

async function getWallet(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, user_id, balance, currency, created_at, updated_at
       FROM wallets
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    res.json({
      success: true,
      wallet: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// =========================
// GET WALLET BALANCE
// =========================

async function getBalance(req, res, next) {
  try {
    const result = await db.query(
      `SELECT balance, currency
       FROM wallets
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    res.json({
      success: true,
      balance: result.rows[0].balance,
      currency: result.rows[0].currency
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWallet,
  getBalance
};
