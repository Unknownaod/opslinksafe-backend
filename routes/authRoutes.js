import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { Agency } from "../models/Agency.js";
import { hashPassword, comparePassword, signJwt } from "../utils/crypto.js";
import { badRequest, unauthorized } from "../utils/httpErrors.js";

export const authRoutes = Router();

// =======================================
// 🔐 LOGIN ROUTE
// =======================================
const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6)
});

// ✅ POST /api/auth/login
authRoutes.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;

    const user = await User.findOne({ username }).populate("agency");
    if (!user || !user.active) throw unauthorized("Invalid credentials");

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid credentials");

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

// ✅ POST /api/auth/bootstrap
authRoutes.post("/bootstrap", validateBody(bootstrapSchema), async (req, res, next) => {
  try {
    // Protect this route in production
    if (process.env.NODE_ENV === "production") {
      throw badRequest("Bootstrap disabled in production");
    }

    const { agencyName, agencyCode, username, displayName, password } = req.validatedBody;

    // Check or create agency
    let agency = await Agency.findOne({ code: agencyCode });
    if (!agency) {
      agency = await Agency.create({
        name: agencyName,
        code: agencyCode,
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ username });
    if (existingUser) throw badRequest("Username already exists");

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
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
    next(err);
  }
});
