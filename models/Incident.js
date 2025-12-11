import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
    incidentId: { type: String, required: true }, // e.g. #2403
    type: { type: String, required: true },       // "Structure Fire"
    priority: { type: String, enum: ["1", "2", "3"], default: "2" },
    status: {
      type: String,
      enum: ["NEW", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "CLEARED", "CANCELLED"],
      default: "NEW"
    },
    location: {
      address: { type: String, required: true },
      lat: Number,
      lng: Number
    },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unitsAssigned: [{ type: String }], // unitId references
    timeline: [
      {
        ts: { type: Date, default: Date.now },
        status: String,
        message: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],
    notes: [
      {
        ts: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String
      }
    ]
  },
  { timestamps: true }
);

incidentSchema.index({ agency: 1, incidentId: 1 }, { unique: true });

export const Incident = mongoose.model("Incident", incidentSchema);
