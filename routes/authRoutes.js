import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { Agency } from "../models/Agency.js";
import { hashPassword, comparePassword, signJwt } from "../utils/crypto.js";
import { badRequest, unauthorized } from "../utils/httpErrors.js";
import mongoose from "mongoose";

export const authRoutes = Router();

// =======================================
// 🔐 LOGIN ROUTE
// =======================================
const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6)
});

authRoutes.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;

    // 🔍 DB debug
    console.log("✅ Connected DB name:", mongoose.connection.name);

    const user = await User.findOne({ username }).populate("agency");

    if (!user) {
      console.warn("⚠️ No user found for username:", username);
      throw unauthorized("Invalid credentials");
    }

    console.log("🧩 Found user:", user.username);
    console.log("🧩 User hash:", user.passwordHash);
    console.log("🧩 Incoming password:", password);

    const ok = await comparePassword(password, user.passwordHash);

    console.log("🧩 Password match result:", ok);

    if (!user.active) {
      console.warn("⚠️ User inactive:", username);
      throw unauthorized("Invalid credentials");
    }

    if (!ok) {
      console.warn("⚠️ Password mismatch for:", username);
      throw unauthorized("Invalid credentials");
    }

    const token = signJwt({
      sub: user._id.toString(),
      role: user.role,
      agencyId: user.agency._id.toString()
    });

    res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        agency: {
          id: user.agency._id,
          name: user.agency.name,
          code: user.agency.code
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// =======================================
// 🧱 BOOTSTRAP ADMIN ROUTE (DEV ONLY)
// =======================================
const bootstrapSchema = z.object({
  agencyName: z.string().min(2),
  agencyCode: z.string().min(2),
  username: z.string().min(2),
  displayName: z.string().min(2),
  password: z.string().min(8)
});

authRoutes.post("/bootstrap", validateBody(bootstrapSchema), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw badRequest("Bootstrap disabled in production");
    }

    const { agencyName, agencyCode, username, displayName, password } = req.validatedBody;

    let agency = await Agency.findOne({ code: agencyCode });
    if (!agency) {
      agency = await Agency.create({ name: agencyName, code: agencyCode });
    }

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

    res.json({
      ok: true,
      message: "✅ Bootstrap admin created successfully",
      agency: { id: agency._id, name: agency.name, code: agency.code },
      user: { id: user._id, username: user.username, displayName: user.displayName, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});
