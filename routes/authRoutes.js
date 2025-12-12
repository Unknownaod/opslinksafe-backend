// routes/authRoutes.js
import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { validateBody } from "../middleware/validate.js";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Agency } from "../models/Agency.js";
import { hashPassword, comparePassword, signJwt } from "../utils/crypto.js";
import { badRequest, unauthorized } from "../utils/httpErrors.js";

export const authRoutes = Router();

/* =======================================
   🧩 Validation Schemas
======================================= */
const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
  password: z.string().min(3, "Password must be at least 3 characters."),
});

const bootstrapSchema = z.object({
  agencyName: z.string().min(2),
  agencyCode: z.string().min(2),
  username: z.string().min(2),
  displayName: z.string().min(2),
  password: z.string().min(6),
});

/* =======================================
   🔐 LOGIN
======================================= */
authRoutes.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;
    console.log("🟦 Login attempt:", username);
    console.log("✅ MongoDB connection:", mongoose.connection.name);

    // Find user and agency
    const user = await User.findOne({ username }).populate("agency");
    if (!user) {
      console.warn("⚠️ No user found for username:", username);
      return next(unauthorized("Invalid credentials"));
    }

    // Compare password
    const ok = await comparePassword(password, user.passwordHash);
    console.log("🔐 Password match result:", ok);

    if (!ok || !user.active) {
      console.warn("⚠️ Invalid password or inactive account:", username);
      return next(unauthorized("Invalid credentials"));
    }

    // Create JWT
    const tokenPayload = {
      sub: user._id.toString(),
      role: user.role,
      agencyId: user.agency?._id?.toString(),
      username: user.username,
    };
    const token = signJwt(tokenPayload);

    console.log("🪪 Signed JWT:", tokenPayload);

    res.status(200).json({
      ok: true,
      message: "✅ Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        agency: user.agency
          ? {
              id: user.agency._id,
              name: user.agency.name,
              code: user.agency.code,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("❌ Login route error:", err);
    next(err);
  }
});

/* =======================================
   🧱 BOOTSTRAP ADMIN (DEV ONLY)
======================================= */
authRoutes.post("/bootstrap", validateBody(bootstrapSchema), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return next(badRequest("Bootstrap disabled in production"));
    }

    const { agencyName, agencyCode, username, displayName, password } = req.validatedBody;

    console.log("🧱 Bootstrapping agency:", agencyCode);

    let agency = await Agency.findOne({ code: agencyCode });
    if (!agency) {
      agency = await Agency.create({
        name: agencyName,
        code: agencyCode,
        supervisorPassword: "opslink", // default supervisor key
      });
      console.log("🏢 Created new agency:", agency.name);
    }

    const existing = await User.findOne({ username });
    if (existing) return next(badRequest("Username already exists"));

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      agency: agency._id,
      username,
      displayName,
      passwordHash,
      role: "ADMIN",
      active: true,
    });

    return res.status(201).json({
      ok: true,
      message: "✅ Bootstrap admin created successfully",
      agency: {
        id: agency._id,
        name: agency.name,
        code: agency.code,
      },
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
    next(err);
  }
});

/* =======================================
   👤 CURRENT USER (/me)
======================================= */
authRoutes.get("/me", authRequired, async (req, res, next) => {
  try {
    console.log("🧭 /me request from:", req.user.username);

    const user = await User.findById(req.user.id)
      .populate("agency")
      .select("-passwordHash");

    if (!user) {
      console.warn("⚠️ /me user not found:", req.user.id);
      return res.status(401).json({ ok: false, error: "User not found" });
    }

    res.status(200).json({
      ok: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        agencyId: user.agency?._id,
        agency: user.agency
          ? {
              id: user.agency._id,
              name: user.agency.name,
              code: user.agency.code,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("❌ /me route error:", err);
    next(err);
  }
});
