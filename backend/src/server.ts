import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";

const server = createServer(app);

server.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async (err) => {
    if (err) {
      console.error("Error closing HTTP server:", err);
      process.exit(1);
    }
    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected. Exiting cleanly.");
      clearTimeout(forceExit);
      process.exit(0);
    } catch (disconnectErr) {
      console.error("Error disconnecting Prisma:", disconnectErr);
      clearTimeout(forceExit);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));