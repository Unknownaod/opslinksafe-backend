import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { hashPassword, comparePassword, signJwt } from "../utils/crypto.js";
import { badRequest, unauthorized } from "../utils/httpErrors.js";

export const authRoutes = Router();

const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6)
});

authRoutes.post("/auth/login", validateBody(loginSchema), async (req, res, next) => {
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

// simple admin user bootstrap route (you'll lock or remove this later)
const bootstrapSchema = z.object({
  agencyName: z.string().min(2),
  agencyCode: z.string().min(2),
  username: z.string().min(2),
  displayName: z.string().min(2),
  password: z.string().min(8)
});

import { Agency } from "../models/Agency.js";

authRoutes.post("/auth/bootstrap", validateBody(bootstrapSchema), async (req, res, next) => {
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
      role: "ADMIN"
    });

    res.json({
      ok: true,
      message: "Bootstrap admin created",
      agency: { id: agency._id, name: agency.name, code: agency.code },
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});
