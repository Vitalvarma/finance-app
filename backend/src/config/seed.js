require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./db");

// Inline User model to avoid circular issues
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["viewer", "analyst", "admin"] },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: "admin@finance.com" });
  if (existing) {
    console.log("Admin already exists. Skipping seed.");
    process.exit(0);
  }

  const password = await bcrypt.hash("Admin@1234", 10);

  await User.create({
    name: "Super Admin",
    email: "admin@finance.com",
    password,
    role: "admin",
    status: "active",
  });

  console.log("✅ Seed complete!");
  console.log("   Email   : admin@finance.com");
  console.log("   Password: Admin@1234");
  process.exit(0);
};

seed();
