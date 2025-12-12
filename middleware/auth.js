import { verifyJwt } from "../utils/crypto.js";
import { unauthorized } from "../utils/httpErrors.js";
import { User } from "../models/User.js";

/**
 * Middleware: authRequired
 * ------------------------------------------
 * Verifies JWT, ensures user is active, and attaches
 * the full user context to req.user for downstream routes.
 */
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization;

    // 🔒 Check for Bearer token
    if (!header || !header.startsWith("Bearer ")) {
      console.warn("⚠️ Missing Authorization header");
      throw unauthorized("Missing or invalid token");
    }

    // ✉️ Extract and verify token
    const token = header.slice(7);
    const payload = verifyJwt(token);
    if (!payload?.sub) {
      console.warn("⚠️ Invalid JWT payload");
      throw unauthorized("Malformed token");
    }

    // 👤 Fetch user and their agency
    const user = await User.findById(payload.sub).populate("agency");
    if (!user) {
      console.warn("⚠️ User not found for token sub:", payload.sub);
      throw unauthorized("User not found");
    }

    if (!user.active) {
      console.warn("⚠️ Inactive account:", user.username);
      throw unauthorized("Account disabled");
    }

    if (!user.agency) {
      console.warn("⚠️ User missing agency link:", user.username);
      throw unauthorized("Agency not found");
    }

    // ✅ Attach minimal context to request for downstream use
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      agencyId: user.agency._id.toString(),
      agencyCode: user.agency.code,
      agencyName: user.agency.name,
      displayName: user.displayName || null,
    };

    next();
  } catch (err) {
    console.error("❌ JWT Auth error:", err.message);
    next(unauthorized("Invalid or expired session"));
  }
}
