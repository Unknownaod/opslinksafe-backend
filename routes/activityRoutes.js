import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { ActivityLog } from "../models/ActivityLog.js";

export const activityRoutes = Router();

activityRoutes.get(
  "/activity",
  authRequired,
  async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;
      const logs = await ActivityLog.find({ agency: req.user.agencyId })
        .sort({ createdAt: -1 })
        .limit(Number(limit));
      res.json({ ok: true, logs });
    } catch (err) {
      next(err);
    }
  }
);
