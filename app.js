import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./db/mongo.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

// ==========================
// 🔥 FIRE / EMS CAD ROUTES
// ==========================
import authRoutes from "./routes/authRoutes.js";          // Authentication & session
import incidentRoutes from "./routes/incidentRoutes.js";  // Dispatch / 911 calls
import unitRoutes from "./routes/unitRoutes.js";          // Active units / apparatus
import activityRoutes from "./routes/activityRoutes.js";  // Call activity / logs
import healthRoutes from "./routes/healthRoutes.js";      // System status

// ==========================
// 🌐 INITIALIZATION
// ==========================
dotenv.config();
connectDB();

const app = express();

// ==========================
// ⚙️ MIDDLEWARE
// ==========================
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// ==========================
// 🚦 RATE LIMITING
// ==========================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ==========================
// 🚑 ROUTES
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/health", healthRoutes);

// ==========================
// ❗ ERROR HANDLING
// ==========================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
