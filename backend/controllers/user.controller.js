const db = require("../config/database");

// =========================
// GET PROFILE
// =========================

async function getProfile(req, res, next) {
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

// =========================
// UPDATE PROFILE
// =========================

async function updateProfile(req, res, next) {
  try {
    const { username, phone } = req.body;

    if (!username && !phone) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update."
      });
    }

    const currentUser = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [req.user.id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (username || phone) {
      const duplicate = await db.query(
        `SELECT id
         FROM users
         WHERE (username = $1 OR phone = $2)
         AND id != $3`,
        [
          username || null,
          phone || null,
          req.user.id
        ]
      );

      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username or phone number is already in use."
        });
      }
    }

    const result = await db.query(
      `UPDATE users
       SET
         username = COALESCE($1, username),
         phone = COALESCE($2, phone),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, phone, role, status, created_at, updated_at`,
      [
        username || null,
        phone || null,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
