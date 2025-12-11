import app from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function start() {
  try {
    // Connect to MongoDB
    await connectMongo();
    logger.info("✅ Connected to MongoDB Atlas");

    // Start Express server
    app.listen(env.PORT, () => {
      logger.info(`🚒 OpsLink SAFE backend listening on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("❌ Fatal startup error", { err });
    process.exit(1);
  }
}

start();
