import dotenv from "dotenv";
dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 4000,
  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12", 10)
};
