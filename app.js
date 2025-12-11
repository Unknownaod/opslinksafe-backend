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
import authRoutes from "./routes/authRoutes.js";
import incidentRoutes from "./routes/IncidentRoutes.js";  // Capital “I”
import unitRoutes from "./routes/unitRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// ==========================
// 🌐 INITIALIZATION
// ==========================
dotenv.config();
connectDB();

const app = express();

// ==========================
// ⚙️ SECURITY & MIDDLEWARE
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
  max: 120,            // Limit each IP to 120 requests/minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ==========================
// 🚑 API ROUTES
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
