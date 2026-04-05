const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ email: "admin@finance.com" });
    if (existing) return; // already seeded, do nothing

    await User.create({
      name: "Super Admin",
      email: "admin@finance.com",
      password: "Admin@1234",
      role: "admin",
      status: "active",
    });

    console.log("✅ Admin user seeded: admin@finance.com / Admin@1234");
  } catch (err) {
    console.error("Seed error:", err.message);
  }
};

module.exports = seedAdmin;