export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupScheduler, stopCleanupScheduler } = await import("./lib/cleanup");
    startCleanupScheduler();

    // Graceful shutdown handlers
    const shutdown = (signal: string) => {
      console.log(`[shutdown] Received ${signal}, cleaning up...`);
      stopCleanupScheduler();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
