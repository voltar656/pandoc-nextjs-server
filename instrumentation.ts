export async function register(): Promise<void> {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupScheduler, stopCleanupScheduler } = await import("./lib/cleanup");
    const { default: logger } = await import("./lib/logger");

    startCleanupScheduler();

    // Graceful shutdown handlers
    const shutdown = (signal: string): void => {
      logger.info({ signal }, "Received shutdown signal, cleaning up");
      stopCleanupScheduler();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
