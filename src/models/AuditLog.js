import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // "INCIDENT_UPDATE", "UNIT_STATUS_CHANGE", etc
    targetCollection: { type: String, required: true },
    targetId: { type: String, required: true },
    before: { type: Object, default: null },
    after: { type: Object, default: null },
    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

auditLogSchema.index({ agency: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
