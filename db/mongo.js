import mongoose from "mongoose";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: false,
      maxPoolSize: 20
    });
    logger.info("✅ Connected to MongoDB");
  } catch (err) {
    logger.error("❌ MongoDB connection failed", { err });
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB error", { err });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}
