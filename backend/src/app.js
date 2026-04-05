require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Connect to MongoDB
connectDB();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});

// Body parser
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Finance Dashboard API is running." });
});

// Routes
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/transactions", apiLimiter, transactionRoutes);
app.use("/api/dashboard", dashboardLimiter, dashboardRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
