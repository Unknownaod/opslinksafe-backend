import { verifyJwt } from "../utils/crypto.js";
import { unauthorized } from "../utils/httpErrors.js";
import { User } from "../models/User.js";

/**
 * Middleware: authRequired
 * ------------------------------------------
 * Validates JWT from Authorization header,
 * ensures the user and agency exist and are active,
 * and attaches a sanitized user context to req.user.
 */
export async function authRequired(req, res, next) {
  const logPrefix = `🔹 [AUTH] [${new Date().toISOString()}]`;

  try {
    const header = req.headers.authorization;
    console.log(`${logPrefix} Incoming Authorization:`, header || "❌ none");

    // 1️⃣ Require a Bearer token
    if (!header || !header.startsWith("Bearer ")) {
      console.warn(`${logPrefix} Missing or invalid Authorization header.`);
      return next(unauthorized("Missing or invalid token"));
    }

    // 2️⃣ Verify JWT
    const token = header.slice(7);
    let payload;
    try {
      payload = verifyJwt(token);
      console.log(`${logPrefix} Decoded JWT payload:`, payload);
    } catch (verifyErr) {
      console.error(`${logPrefix} JWT verification failed:`, verifyErr.message);
      return next(unauthorized("Invalid or expired session"));
    }

    if (!payload?.sub) {
      console.warn(`${logPrefix} Malformed JWT payload (missing sub):`, payload);
      return next(unauthorized("Malformed token"));
    }

    // 3️⃣ Fetch user from DB
    const user = await User.findById(payload.sub).populate("agency");
    if (!user) {
      console.warn(`${logPrefix} User not found for sub:`, payload.sub);
      return next(unauthorized("User not found"));
    }

    if (!user.active) {
      console.warn(`${logPrefix} Inactive account:`, user.username);
      return next(unauthorized("Account disabled"));
    }

    if (!user.agency) {
      console.warn(`${logPrefix} Missing agency link for:`, user.username);
      return next(unauthorized("Agency not found"));
    }

    // 4️⃣ Attach safe user context
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      displayName: user.displayName || null,
      agencyId: user.agency._id.toString(),
      agencyCode: user.agency.code,
      agencyName: user.agency.name,
    };

    console.log(
      `${logPrefix} ✅ Authenticated: ${req.user.username} (${req.user.role}) from ${req.user.agencyCode}`
    );

    return next();
  } catch (err) {
    console.error(`${logPrefix} ❌ Middleware exception:`, err.message);
    console.error(`${logPrefix} Stack trace:`, err.stack);
    // Only send one response
    return next(unauthorized("Invalid or expired session"));
  }
}
