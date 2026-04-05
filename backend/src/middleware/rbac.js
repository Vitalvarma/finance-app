/**
 * Role hierarchy:
 *   viewer   → read-only dashboard access
 *   analyst  → read + summaries + insights
 *   admin    → full access including user management
 *
 * Usage: authorize("admin") or authorize("analyst", "admin")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
