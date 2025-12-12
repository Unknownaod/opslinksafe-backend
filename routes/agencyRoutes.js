import { Router } from "express";
import { Agency } from "../models/Agency.js";

export const agencyRoutes = Router();

/**
 * @route GET /api/agency/:id
 * @desc  Fetch a single agency by its MongoDB _id
 * @access Private (requires auth if you have middleware)
 */
agencyRoutes.get("/:id", async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({ error: "Agency not found" });
    }

    // ✅ Don’t send the supervisor password to the frontend
    const safeAgency = {
      _id: agency._id,
      name: agency.name,
      code: agency.code,
      timezone: agency.timezone,
      settings: agency.settings,
    };

    res.json({ agency: safeAgency });
  } catch (err) {
    console.error("Error fetching agency:", err);
    res.status(500).json({ error: "Server error fetching agency" });
  }
});
