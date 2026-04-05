const Transaction = require("../models/Transaction");

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10, sortBy = "date", order = "desc" } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate("createdBy", "name email");
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    return res.status(200).json({ success: true, transaction });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// POST /api/transactions  (analyst, admin)
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: "Transaction created.", transaction });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// PUT /api/transactions/:id  (analyst, admin)
const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    // Analysts can only update their own records
    if (req.user.role === "analyst" && transaction.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Analysts can only edit their own transactions." });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: "Transaction updated.", transaction: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// DELETE /api/transactions/:id  (admin only — soft delete)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    // Soft delete
    transaction.isDeleted = true;
    await transaction.save();

    return res.status(200).json({ success: true, message: "Transaction deleted (soft)." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

module.exports = { getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction };
