import { NextApiRequest, NextApiResponse } from "next";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 30; // 30 requests per minute per IP

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, WINDOW_MS);

function getClientIP(req: NextApiRequest): string {
  // Check common proxy headers
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  const realIP = req.headers["x-real-ip"];
  if (typeof realIP === "string") {
    return realIP;
  }
  return req.socket?.remoteAddress || "unknown";
}

export function rateLimit(req: NextApiRequest, res: NextApiResponse): boolean {
  const ip = getClientIP(req);
  const now = Date.now();

  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window
    entry = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitStore.set(ip, entry);
  } else {
    entry.count++;
  }

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please try again later.",
    });
    return false;
  }

  return true;
}
