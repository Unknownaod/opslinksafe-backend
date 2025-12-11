import bcrypt from "bcrypt"; // ✅ not bcryptjs
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signJwt(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function verifyJwt(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
