import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// ==========================
// 📁 PATH HELPERS
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// 🧠 INITIALIZE APP
// ==========================
const app = express();

// ==========================
// ⚙️ SECURITY & CORE MIDDLEWARE
// ==========================
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://safe.opslinksystems.xyz", // frontend domain
      "http://localhost:5173",           // local dev
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// ==========================
// 🚦 RATE LIMITING
// ==========================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ==========================
// 🧩 AUTO-LOAD MODELS
// ==========================
const modelsPath = path.join(__dirname, "models");
if (fs.existsSync(modelsPath)) {
  for (const file of fs.readdirSync(modelsPath)) {
    if (file.endsWith(".js")) {
      try {
        await import(path.join(modelsPath, file));
        console.log(`✅ Loaded model: ${file}`);
      } catch (err) {
        console.error(`❌ Failed to load model: ${file}`, err);
      }
    }
  }
}

// ==========================
// 🚑 ROUTES
// ==========================
const routes = [
  { path: "/api/auth", file: "./routes/authRoutes.js" },
  { path: "/api/incidents", file: "./routes/incidentRoutes.js" },
  { path: "/api/units", file: "./routes/unitRoutes.js" },
  { path: "/api/activity", file: "./routes/activityRoutes.js" },
  { path: "/api/health", file: "./routes/healthRoutes.js" },
  { path: "/api/agency", file: "./routes/agencyRoutes.js" }, // 🟦 ADDED
];

for (const r of routes) {
  try {
    console.log(`🧩 Mounting route: ${r.path} from ${r.file}`);
    const routeModule = await import(r.file);
    const route =
      routeModule.default ||
      routeModule[r.name] ||
      Object.values(routeModule)[0];
    app.use(r.path, route);
    console.log(`✅ Mounted route: ${r.path}`);
  } catch (err) {
    console.error(`❌ Failed to load route: ${r.file}`, err);
  }
}

// ==========================
// 🩺 HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.json({ ok: true, service: "OpsLink SAFE Backend", status: "online" });
});

// ==========================
// ❗ ERROR HANDLING
// ==========================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
