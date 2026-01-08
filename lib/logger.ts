/**
 * Structured logging using pino.
 *
 * Provides a base logger and request-scoped child loggers with
 * automatic request ID tracking and client IP extraction.
 *
 * Configuration via environment variables:
 * - LOG_LEVEL: trace | debug | info | warn | error | fatal (default: info)
 * - NODE_ENV: set to "development" for pretty-printed output
 *
 * @module lib/logger
 */

import pino from "pino";
import { NextApiRequest } from "next";
import { v4 as uuidv4 } from "uuid";

// Configure base logger with pretty printing in development
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export type Logger = pino.Logger;

/**
 * Create a child logger with request context.
 *
 * Extracts or generates a request ID, and captures the HTTP method,
 * path, and client IP for all log entries.
 *
 * @param req - Next.js API request object
 * @returns A pino child logger with request context bound
 */
export function createRequestLogger(req: NextApiRequest): Logger {
  const requestId = (req.headers["x-request-id"] as string | undefined) || uuidv4();
  const clientIp = getClientIp(req);

  return logger.child({
    requestId,
    method: req.method,
    path: req.url,
    clientIp,
  });
}

/**
 * Extract client IP from request headers or socket
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0];
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }
  return req.socket?.remoteAddress || "unknown";
}

export default logger;
