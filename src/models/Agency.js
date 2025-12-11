import mongoose from "mongoose";

const agencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g. "HILLSFIRE"
    timezone: { type: String, default: "America/Toronto" },
    settings: {
      responsePlans: {
        type: Map,
        of: [String], // { "Structure Fire": ["ENG1", "TRK1", "BATT1"] }
        default: {}
      },
      mapCenter: {
        lat: Number,
        lng: Number
      }
    }
  },
  { timestamps: true }
);

export const Agency = mongoose.model("Agency", agencySchema);
