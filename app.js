import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./db/mongo.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// ==========================
// 📁 PATH HELPERS
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// 🧠 INITIALIZE APP & DB
// ==========================
const app = express();
connectDB();

// ==========================
// ⚙️ SECURITY & CORE MIDDLEWARE
// ==========================
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
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
// 🧩 AUTO-LOAD MODELS
// ==========================
const modelsPath = path.join(__dirname, "models");
if (fs.existsSync(modelsPath)) {
  fs.readdirSync(modelsPath)
    .filter((file) => file.endsWith(".js"))
    .forEach(async (file) => {
      try {
        await import(path.join(modelsPath, file));
        console.log(`✅ Loaded model: ${file}`);
      } catch (err) {
        console.error(`❌ Failed to load model: ${file}`, err);
      }
    });
}

// ==========================
// 🚑 FIRE / EMS ROUTES
// ==========================
const routes = [
  { path: "/api/auth", file: "./routes/authRoutes.js" },
  { path: "/api/incidents", file: "./routes/IncidentRoutes.js" },
  { path: "/api/units", file: "./routes/unitRoutes.js" },
  { path: "/api/activity", file: "./routes/activityRoutes.js" },
  { path: "/api/health", file: "./routes/healthRoutes.js" },
];

for (const r of routes) {
  try {
    const routeModule = await import(r.file);
    const route = routeModule.default || routeModule[r.name] || Object.values(routeModule)[0];
    app.use(r.path, route);
    console.log(`✅ Mounted route: ${r.path}`);
  } catch (err) {
    console.error(`❌ Failed to load route: ${r.file}`, err);
  }
}

// ==========================
// ❗ ERROR HANDLING
// ==========================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
