import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function start() {
  try {
    // Connect to MongoDB first
    await connectMongo();
    logger.info("✅ Connected to MongoDB Atlas");

    // Initialize Express app
    const app = createApp();

    // Start listening
    app.listen(env.PORT, () => {
      logger.info(`🚒 OpsLink SAFE backend listening on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("❌ Fatal startup error", { err });
    process.exit(1);
  }
}

start();
