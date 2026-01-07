import pino from "pino";
import { NextApiRequest } from "next";
import { v4 as uuidv4 } from "uuid";

// Configure base logger
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
 * Create a child logger with request context
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
