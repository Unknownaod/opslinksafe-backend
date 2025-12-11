import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "/routes/authRoutes.js";
import incidentRoutes from "/routes/incidentRoutes.js";
import unitRoutes from "/routes/unitRoutes.js";
import activityRoutes from "/routes/activityRoutes.js";
import healthRoutes from "/routes/healthRoutes.js";
import { notFoundHandler, errorHandler } from "/middleware/errorHandler.js";
import connectDB from "/db/mongo.js";

dotenv.config();

export function createApp() {
  const app = express();

  /* ======================================================
     ✅ CORE SECURITY & SETUP
  ====================================================== */
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: false }));

  /* ======================================================
     ✅ LOGGING & RATE LIMITING
  ====================================================== */
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120,            // limit each IP to 120 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  /* ======================================================
     ✅ DATABASE CONNECTION
  ====================================================== */
  connectDB();

  /* ======================================================
     ✅ ROUTES
  ====================================================== */
  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", incidentRoutes);
  app.use("/api", unitRoutes);
  app.use("/api", activityRoutes);

  /* ======================================================
     ✅ ROOT & ERROR HANDLERS
  ====================================================== */
  app.get("/", (req, res) => {
    res.json({
      service: "OpsLink SAFE Backend",
      status: "✅ Online",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
