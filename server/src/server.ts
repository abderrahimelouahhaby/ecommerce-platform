import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});

// Hosting platforms and Docker send SIGTERM to stop the app.
// We stop accepting new requests, let the current ones finish, and then exit.
function shutdown(signal: string): void {
  logger.info(`${signal} received, closing server`);
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
