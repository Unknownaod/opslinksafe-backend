import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { Incident } from "../models/Incident.js";
import { Unit } from "../models/Unit.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { AuditLog } from "../models/AuditLog.js";
import { badRequest, notFound } from "../utils/httpErrors.js";

export const incidentRoutes = Router();

// Schema for creating an incident
const createIncidentSchema = z.object({
  incidentId: z.string().min(3),
  type: z.string().min(2),
  priority: z.enum(["1", "2", "3"]).default("2"),
  address: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional()
});

// ✅ Create new incident
incidentRoutes.post(
  "/", // was "/incidents"
  authRequired,
  requireRole("DISPATCHER", "SUPERVISOR", "ADMIN"),
  validateBody(createIncidentSchema),
  async (req, res, next) => {
    try {
      const { incidentId, type, priority, address, lat, lng } = req.validatedBody;
      const existing = await Incident.findOne({
        agency: req.user.agencyId,
        incidentId
      });
      if (existing) throw badRequest("Incident ID already exists for this agency");

      const incident = await Incident.create({
        agency: req.user.agencyId,
        incidentId,
        type,
        priority,
        location: { address, lat, lng },
        openedBy: req.user.id,
        status: "NEW",
        timeline: [{ status: "NEW", message: "Incident created", user: req.user.id }]
      });

      await ActivityLog.create({
        agency: req.user.agencyId,
        type: "INCIDENT",
        code: "CREATE",
        incidentId: incident.incidentId,
        user: req.user.id,
        message: `Incident ${incident.incidentId} created (${incident.type})`
      });

      res.status(201).json({ ok: true, incident });
    } catch (err) {
      next(err);
    }
  }
);

// ✅ Assign units
const assignUnitsSchema = z.object({
  units: z.array(z.string().min(1)).min(1)
});

incidentRoutes.post(
  "/:id/assign",
  authRequired,
  requireRole("DISPATCHER", "SUPERVISOR", "ADMIN"),
  validateBody(assignUnitsSchema),
  async (req, res, next) => {
    try {
      const incident = await Incident.findOne({
        agency: req.user.agencyId,
        incidentId: req.params.id
      });
      if (!incident) throw notFound("Incident not found");

      const before = incident.toObject();
      const { units: unitIds } = req.validatedBody;

      const units = await Unit.find({
        agency: req.user.agencyId,
        unitId: { $in: unitIds }
      });

      const validIds = units.map((u) => u.unitId);
      incident.unitsAssigned = Array.from(new Set([...incident.unitsAssigned, ...validIds]));
      if (incident.status === "NEW") incident.status = "DISPATCHED";

      incident.timeline.push({
        status: incident.status,
        message: `Units assigned: ${validIds.join(", ")}`,
        user: req.user.id
      });

      await incident.save();
      await Unit.updateMany(
        { agency: req.user.agencyId, unitId: { $in: validIds } },
        { $set: { status: "DISPATCHED", currentIncidentId: incident.incidentId } }
      );

      await ActivityLog.create({
        agency: req.user.agencyId,
        type: "INCIDENT",
        code: "ASSIGN_UNITS",
        incidentId: incident.incidentId,
        user: req.user.id,
        message: `Units assigned: ${validIds.join(", ")}`
      });

      await AuditLog.create({
        agency: req.user.agencyId,
        user: req.user.id,
        action: "INCIDENT_ASSIGN_UNITS",
        targetCollection: "Incident",
        targetId: incident.incidentId,
        before,
        after: incident.toObject(),
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.json({ ok: true, incident });
    } catch (err) {
      next(err);
    }
  }
);

// ✅ Update status
const statusSchema = z.object({
  status: z.enum(["NEW", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "CLEARED", "CANCELLED"])
});

incidentRoutes.post(
  "/:id/status",
  authRequired,
  requireRole("DISPATCHER", "SUPERVISOR", "ADMIN"),
  validateBody(statusSchema),
  async (req, res, next) => {
    try {
      const incident = await Incident.findOne({
        agency: req.user.agencyId,
        incidentId: req.params.id
      });
      if (!incident) throw notFound("Incident not found");

      const before = incident.toObject();
      const { status } = req.validatedBody;
      incident.status = status;

      incident.timeline.push({
        status,
        message: `Status set to ${status}`,
        user: req.user.id
      });

      await incident.save();

      await ActivityLog.create({
        agency: req.user.agencyId,
        type: "INCIDENT",
        code: "STATUS",
        incidentId: incident.incidentId,
        user: req.user.id,
        message: `Incident status changed to ${status}`
      });

      await AuditLog.create({
        agency: req.user.agencyId,
        user: req.user.id,
        action: "INCIDENT_STATUS_CHANGE",
        targetCollection: "Incident",
        targetId: incident.incidentId,
        before,
        after: incident.toObject(),
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.json({ ok: true, incident });
    } catch (err) {
      next(err);
    }
  }
);

// ✅ List incidents
incidentRoutes.get(
  "/",
  authRequired,
  async (req, res, next) => {
    try {
      const { status, limit = 50 } = req.query;
      const q = { agency: req.user.agencyId };
      if (status) q.status = status;

      const incidents = await Incident.find(q)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      res.json({ ok: true, incidents });
    } catch (err) {
      next(err);
    }
  }
);
