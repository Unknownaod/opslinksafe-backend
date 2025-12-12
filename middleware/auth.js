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

    // 🔍 Debug incoming header
    console.log("🔹 [AUTH] Incoming Authorization:", header || "❌ none");

    // 🔒 Check for Bearer token
    if (!header || !header.startsWith("Bearer ")) {
      console.warn("⚠️ Missing or invalid Authorization header");
      throw unauthorized("Missing or invalid token");
    }

    // ✉️ Extract and verify token
    const token = header.slice(7);
    let payload;
    try {
      payload = verifyJwt(token);
      console.log("🧩 [AUTH] Decoded JWT payload:", payload);
    } catch (verifyErr) {
      console.error("❌ [AUTH] JWT verification failed:", verifyErr.message);
      throw unauthorized("Invalid or expired session");
    }

    // 🧠 Check for subject ID
    if (!payload?.sub) {
      console.warn("⚠️ [AUTH] JWT missing 'sub' field or malformed payload:", payload);
      throw unauthorized("Malformed token");
    }

    // 👤 Fetch user and their agency
    const user = await User.findById(payload.sub).populate("agency");
    console.log("👤 [AUTH] Fetched user:", user ? user.username : "❌ not found");

    if (!user) {
      console.warn("⚠️ [AUTH] No user found for token sub:", payload.sub);
      throw unauthorized("User not found");
    }

    if (!user.active) {
      console.warn("⚠️ [AUTH] Inactive account:", user.username);
      throw unauthorized("Account disabled");
    }

    if (!user.agency) {
      console.warn("⚠️ [AUTH] Missing agency link for:", user.username);
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

    console.log("✅ [AUTH] Authenticated as:", req.user.username, "(", req.user.role, ")");
    next();
  } catch (err) {
    console.error("❌ [AUTH] Middleware error:", err.message);
    console.error("📜 [AUTH] Stack trace:", err.stack);
    next(unauthorized("Invalid or expired session"));
  }
}
