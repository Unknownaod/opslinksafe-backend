import mongoose from "mongoose";

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
      enum: ["AVAILABLE", "EN_ROUTE", "ON_SCENE", "RETURNING", "OUT_OF_SERVICE"],
      default: "AVAILABLE"
    },
    assignedIncident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
    location: { type: String },
    personnel: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

// ✅ Make sure the model name is "Unit" (not "User")
export const Unit = mongoose.models.Unit || mongoose.model("Unit", unitSchema);
