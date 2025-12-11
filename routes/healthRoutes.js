import { Router } from "express";
import mongoose from "mongoose";

export const healthRoutes = Router();

healthRoutes.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.json({
    ok: true,
    service: "opslink-safe-backend",
    dbConnected: dbState === 1
  });
});
