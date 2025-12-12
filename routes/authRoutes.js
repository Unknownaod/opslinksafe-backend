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

// =======================================
// 🧩 Zod Schemas
// =======================================
const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});

const bootstrapSchema = z.object({
  agencyName: z.string().min(2),
  agencyCode: z.string().min(2),
  username: z.string().min(2),
  displayName: z.string().min(2),
  password: z.string().min(8)
});

// =======================================
// 🔐 LOGIN ROUTE
// =======================================
authRoutes.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;
    console.log("🟦 Login attempt:", username);

    // Debug connection state
    console.log("✅ MongoDB:", mongoose.connection.name);

    // Fetch user with agency relationship
    const user = await User.findOne({ username }).populate("agency");
    if (!user) {
      console.warn("⚠️ No user found for username:", username);
      throw unauthorized("Invalid credentials");
    }

    // Check password
    const ok = await comparePassword(password, user.passwordHash);
    console.log("🔐 Password match result:", ok);

    if (!ok || !user.active) {
      console.warn(`⚠️ Invalid credentials or inactive account: ${username}`);
      throw unauthorized("Invalid credentials");
    }

    // Create signed JWT token
    const token = signJwt({
      sub: user._id.toString(),
      role: user.role,
      agencyId: user.agency?._id?.toString()
    });

    // Respond with user info
    return res.status(200).json({
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
              code: user.agency.code
            }
          : null
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    next(err);
  }
});

// =======================================
// 🧱 BOOTSTRAP ADMIN ROUTE (DEV ONLY)
// =======================================
authRoutes.post("/bootstrap", validateBody(bootstrapSchema), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw badRequest("Bootstrap disabled in production");
    }

    const { agencyName, agencyCode, username, displayName, password } = req.validatedBody;
    console.log("🧱 Bootstrapping new agency:", agencyCode);

    // Ensure agency exists or create it
    let agency = await Agency.findOne({ code: agencyCode });
    if (!agency) {
      agency = await Agency.create({ name: agencyName, code: agencyCode });
      console.log("🏢 Created new agency:", agency.name);
    }

    // Prevent duplicate users
    const existingUser = await User.findOne({ username });
    if (existingUser) throw badRequest("Username already exists");

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      agency: agency._id,
      username,
      displayName,
      passwordHash,
      role: "ADMIN",
      active: true
    });

    return res.status(201).json({
      ok: true,
      message: "✅ Bootstrap admin created successfully",
      agency: {
        id: agency._id,
        name: agency.name,
        code: agency.code
      },
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Bootstrap error:", err.message);
    next(err);
  }
});

// =======================================
// 👤 CURRENT USER (/me)
// =======================================
authRoutes.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub)
      .populate("agency")
      .select("-passwordHash");

    if (!user) throw unauthorized("User not found");

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
              code: user.agency.code
            }
          : null
      }
    });
  } catch (err) {
    console.error("❌ /me error:", err.message);
    next(err);
  }
});
