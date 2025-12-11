import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
    type: { type: String, required: true }, // INCIDENT, UNIT, AUTH, SYSTEM, etc
    code: { type: String },                 // optional sub-type
    incidentId: { type: String },
    unitId: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

activityLogSchema.index({ agency: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
