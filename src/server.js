import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function start() {
  await connectMongo();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`🚒 OpsLink SAFE backend listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error("Fatal startup error", { err });
  process.exit(1);
});
