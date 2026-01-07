import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import appConfig from "./config";
import logger from "./logger";

const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function cleanupOldFiles(): Promise<void> {
  const uploadDir = appConfig.uploadDir;
  const now = Date.now();

  try {
    const files = await readdir(uploadDir);

    for (const file of files) {
      // Skip README or other permanent files
      if (file === "README.md" || file === ".gitkeep") continue;

      const filePath = join(uploadDir, file);
      try {
        const stats = await stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > MAX_AGE_MS) {
          await unlink(filePath);
          logger.info({ file, ageMinutes: Math.round(age / 60000) }, "Deleted old file");
        }
      } catch (err: unknown) {
        // File may have been deleted by another process
        logger.warn({ file, err }, "Could not process file during cleanup");
      }
    }
  } catch (err: unknown) {
    logger.error({ err }, "Failed to read upload directory during cleanup");
  }
}

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler(): void {
  if (cleanupInterval) return; // Already running

  // Run immediately on startup
  logger.info("Running startup cleanup");
  void cleanupOldFiles();

  // Schedule periodic cleanup
  cleanupInterval = setInterval(() => {
    logger.info("Running scheduled cleanup");
    void cleanupOldFiles();
  }, CLEANUP_INTERVAL_MS);

  logger.info(
    {
      intervalMinutes: CLEANUP_INTERVAL_MS / 60000,
      maxAgeMinutes: MAX_AGE_MS / 60000,
    },
    "Cleanup scheduler started"
  );
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("Cleanup scheduler stopped");
  }
}
