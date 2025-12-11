import mongoose from "mongoose";

// Fire/EMS Unit model
const unitSchema = new mongoose.Schema(
  {
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },

    unitId: { type: String, required: true, unique: true },
    callsign: { type: String, required: true },

    type: {
      type: String,
      enum: ["ENGINE", "LADDER", "RESCUE", "AMBULANCE", "COMMAND"],
      required: true
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "RETURNING", "OUT_OF_SERVICE"],
      default: "AVAILABLE"
    },

    currentIncidentId: { type: String, default: null },
    location: { type: String },
    personnel: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

// ✅ Prevent model redefinition & ensure named export
export const Unit = mongoose.models.Unit || mongoose.model("Unit", unitSchema);
