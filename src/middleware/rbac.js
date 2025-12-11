import { forbidden } from "../utils/httpErrors.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(forbidden("Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(forbidden("Insufficient permissions"));
    }
    next();
  };
}
