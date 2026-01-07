import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import appConfig from "./config";

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
          console.log(`[cleanup] Deleted old file: ${file} (age: ${Math.round(age / 60000)}min)`);
        }
      } catch (err) {
        // File may have been deleted by another process
        console.warn(`[cleanup] Could not process ${file}:`, err);
      }
    }
  } catch (err) {
    console.error("[cleanup] Failed to read upload directory:", err);
  }
}

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler(): void {
  if (cleanupInterval) return; // Already running

  // Run immediately on startup
  console.log("[cleanup] Running startup cleanup...");
  cleanupOldFiles();

  // Schedule periodic cleanup
  cleanupInterval = setInterval(() => {
    console.log("[cleanup] Running scheduled cleanup...");
    cleanupOldFiles();
  }, CLEANUP_INTERVAL_MS);

  console.log(`[cleanup] Scheduler started (interval: ${CLEANUP_INTERVAL_MS / 60000}min, max age: ${MAX_AGE_MS / 60000}min)`);
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[cleanup] Scheduler stopped");
  }
}
