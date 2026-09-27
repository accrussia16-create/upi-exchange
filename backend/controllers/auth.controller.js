const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

// =========================
// REGISTER
// =========================
async function register(req, res, next) {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, phone and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const existingUser = await db.query(
      "SELECT id FROM users WHERE username = $1 OR phone = $2",
      [username, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or phone number is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (username, phone, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, phone, role, status, created_at`,
      [username, phone, passwordHash]
    );

    const user = result.rows[0];

    await db.query(
      `INSERT INTO wallets (user_id, balance, currency)
       VALUES ($1, 0, 'PKR')`,
      [user.id]
    );

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

// =========================
// LOGIN
// =========================
async function login(req, res, next) {
  try {
    const { username, phone, password } = req.body;

    if ((!username && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Username or phone and password are required."
      });
    }

    const loginValue = username || phone;

    const result = await db.query(
      `SELECT id, username, phone, password_hash, role, status
       FROM users
       WHERE username = $1 OR phone = $1`,
      [loginValue]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid login details."
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid login details."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password_hash;

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

// =========================
// GET CURRENT USER
// =========================
async function me(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, username, phone, role, status, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me
};
