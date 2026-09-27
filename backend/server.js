const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const db = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// =========================
// DATABASE INITIALIZATION
// =========================

async function initializeDatabase() {
  try {
    const schemaPath = path.join(
      __dirname,
      "..",
      "database",
      "schema.sql"
    );

    const schema = fs.readFileSync(schemaPath, "utf8");

    await db.query(schema);

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:");
    console.error(error);
    throw error;
  }
}

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UPI-Exchange API is running."
  });
});

// =========================
// API ROUTES
// =========================

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const walletRoutes = require("./routes/wallet.routes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/wallet", walletRoutes);

// =========================
// 404 HANDLER
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

// =========================
// START SERVER
// =========================

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`UPI-Exchange API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server could not start.");
    process.exit(1);
  }
}

startServer();
