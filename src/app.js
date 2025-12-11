import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { authRoutes } from "./routes/authRoutes.js";
import { incidentRoutes } from "./routes/incidentRoutes.js";
import { unitRoutes } from "./routes/unitRoutes.js";
import { activityRoutes } from "./routes/activityRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // security & parsing
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // logging
  app.use(morgan("combined"));

  // basic rate limiting
  const limiter = rateLimit({
    windowMs: 60_000,
    max: 120
  });
  app.use(limiter);

  // routes
  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", incidentRoutes);
  app.use("/api", unitRoutes);
  app.use("/api", activityRoutes);

  // 404 / errors
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
