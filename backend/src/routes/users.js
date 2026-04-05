const express = require("express");
const { body } = require("express-validator");
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");

const router = express.Router();

// All user management routes require admin role
router.use(protect, authorize("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email required."),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars."),
    body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Role must be viewer, analyst, or admin."),
  ],
  validate,
  createUser
);

router.patch(
  "/:id",
  [
    body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role."),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Status must be active or inactive."),
  ],
  validate,
  updateUser
);

router.delete("/:id", deleteUser);

module.exports = router;
