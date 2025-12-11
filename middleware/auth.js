import { verifyJwt } from "../utils/crypto.js";
import { unauthorized } from "../utils/httpErrors.js";
import { User } from "../models/User.js";

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw unauthorized();
    }

    const token = header.substring(7);
    const payload = verifyJwt(token);

    const user = await User.findById(payload.sub).populate("agency");
    if (!user || !user.active) {
      throw unauthorized("Account disabled or not found");
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      agencyId: user.agency._id.toString(),
      agencyCode: user.agency.code,
      username: user.username
    };

    next();
  } catch (err) {
    next(unauthorized());
  }
}
