export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupScheduler } = await import("./lib/cleanup");
    startCleanupScheduler();
  }
}
