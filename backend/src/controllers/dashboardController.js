const Transaction = require("../models/Transaction");

// GET /api/dashboard/summary  (all roles)
// Returns: total income, total expenses, net balance, record count
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (startDate || endDate) matchStage.date = dateFilter;

    const result = await Transaction.aggregate([
      { $match: { isDeleted: false, ...matchStage } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = result.find((r) => r._id === "income") || { total: 0, count: 0 };
    const expense = result.find((r) => r._id === "expense") || { total: 0, count: 0 };

    return res.status(200).json({
      success: true,
      summary: {
        totalIncome: income.total,
        totalExpenses: expense.total,
        netBalance: income.total - expense.total,
        totalTransactions: income.count + expense.count,
        incomeCount: income.count,
        expenseCount: expense.count,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/dashboard/category-breakdown  (analyst, admin)
// Returns: per-category totals split by type
const getCategoryBreakdown = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const matchStage = { isDeleted: false };
    if (type) matchStage.type = type;
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const breakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Reshape for easier frontend consumption
    const shaped = breakdown.map((b) => ({
      category: b._id.category,
      type: b._id.type,
      total: b.total,
      count: b.count,
    }));

    return res.status(200).json({ success: true, breakdown: shaped });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/dashboard/trends  (analyst, admin)
// Returns: monthly income vs expenses for the past N months
const getTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const trends = await Transaction.aggregate([
      { $match: { isDeleted: false, date: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Normalise into [{year, month, income, expense}]
    const map = {};
    for (const t of trends) {
      const key = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
      if (!map[key]) map[key] = { year: t._id.year, month: t._id.month, period: key, income: 0, expense: 0 };
      map[key][t._id.type] = t.total;
    }

    return res.status(200).json({ success: true, trends: Object.values(map) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/dashboard/recent  (all roles)
// Returns: last N transactions
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const transactions = await Transaction.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

module.exports = { getSummary, getCategoryBreakdown, getTrends, getRecentActivity };
