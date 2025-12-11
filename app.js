import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import connectDB from "./db/mongo.js";

dotenv.config();

export function createApp() {
  const app = express();

  // Security & middleware
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Logging
  app.use(morgan("combined"));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60_000,
    max: 120,
  });
  app.use(limiter);

  // Routes
  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", incidentRoutes);
  app.use("/api", unitRoutes);
  app.use("/api", activityRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
