const { validationResult } = require("express-validator");

/**
 * Reads express-validator results and returns a 422 if any errors exist.
 * Place this AFTER your validation chain in a route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
