import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { Unit } from "../models/Unit.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { AuditLog } from "../models/AuditLog.js";
import { notFound, badRequest } from "../utils/httpErrors.js";

export const unitRoutes = Router();

const statusSchema = z.object({
  status: z.enum(["AVAILABLE", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORT", "CLEAR", "OUT_OF_SERVICE"])
});

unitRoutes.post(
  "/units/:unitId/status",
  authRequired,
  requireRole("FIELD", "DISPATCHER", "SUPERVISOR", "ADMIN"),
  validateBody(statusSchema),
  async (req, res, next) => {
    try {
      const unit = await Unit.findOne({
        agency: req.user.agencyId,
        unitId: req.params.unitId.toUpperCase()
      });
      if (!unit) throw notFound("Unit not found");

      const before = unit.toObject();
      const { status } = req.validatedBody;

      // basic guard (no weird jumps)
      const allowedTransitions = new Set([
        "AVAILABLE", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORT", "CLEAR", "OUT_OF_SERVICE"
      ]);
      if (!allowedTransitions.has(status)) throw badRequest("Invalid status");

      unit.status = status;
      if (status === "AVAILABLE" || status === "OUT_OF_SERVICE" || status === "CLEAR") {
        unit.currentIncidentId = null;
      }
      unit.location = unit.location || {};
      unit.location.lastUpdate = new Date();

      await unit.save();

      await ActivityLog.create({
        agency: req.user.agencyId,
        type: "UNIT",
        code: "STATUS",
        unitId: unit.unitId,
        user: req.user.id,
        message: `Unit ${unit.unitId} status set to ${status}`
      });

      await AuditLog.create({
        agency: req.user.agencyId,
        user: req.user.id,
        action: "UNIT_STATUS_CHANGE",
        targetCollection: "Unit",
        targetId: unit.unitId,
        before,
        after: unit.toObject(),
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.json({ ok: true, unit });
    } catch (err) {
      next(err);
    }
  }
);

// list units for boards
unitRoutes.get(
  "/units",
  authRequired,
  async (req, res, next) => {
    try {
      const units = await Unit.find({ agency: req.user.agencyId }).sort({ unitId: 1 });
      res.json({ ok: true, units });
    } catch (err) {
      next(err);
    }
  }
);
