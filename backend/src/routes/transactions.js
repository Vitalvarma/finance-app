const express = require("express");
const { body } = require("express-validator");
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

const transactionValidation = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number."),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO date."),
];

// All roles can read
router.get("/", getTransactions);
router.get("/:id", getTransactionById);

// Analyst + Admin can create/update
router.post("/", authorize("analyst", "admin"), transactionValidation, validate, createTransaction);
router.put("/:id", authorize("analyst", "admin"), transactionValidation, validate, updateTransaction);

// Only Admin can delete (soft delete)
router.delete("/:id", authorize("admin"), deleteTransaction);

module.exports = router;
