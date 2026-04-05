const express = require("express");
const { getSummary, getCategoryBreakdown, getTrends, getRecentActivity } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

const router = express.Router();

router.use(protect);

// All roles: summary + recent activity
router.get("/summary", getSummary);
router.get("/recent", getRecentActivity);

// Analyst + Admin: detailed breakdowns and trends
router.get("/category-breakdown", authorize("analyst", "admin"), getCategoryBreakdown);
router.get("/trends", authorize("analyst", "admin"), getTrends);

module.exports = router;
