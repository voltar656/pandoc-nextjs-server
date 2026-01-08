/**
 * Standardized error handling for API endpoints.
 *
 * Provides AppError class for typed errors with HTTP status codes,
 * ErrorCode enum for machine-readable error types, and sendError()
 * helper for consistent JSON error responses.
 *
 * @module lib/errors
 */

import { NextApiResponse } from "next";
import { Logger } from "./logger";

/**
 * Standard error response format returned by all API endpoints.
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  requestId?: string;
}

/**
 * Standard success response format for non-file responses
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

/**
 * Application error codes
 */
/* eslint-disable no-unused-vars */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  RATE_LIMITED = "RATE_LIMITED",

  // Server errors (5xx)
  CONVERSION_FAILED = "CONVERSION_FAILED",
  FILE_READ_ERROR = "FILE_READ_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
/* eslint-enable no-unused-vars */

/**
 * Custom application error with status code and error code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(message: string, statusCode: number, code: ErrorCode) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string, code = ErrorCode.BAD_REQUEST): AppError {
    return new AppError(message, 400, code);
  }

  static validationError(message: string): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR);
  }

  static missingField(field: string): AppError {
    return new AppError(`Missing required field: '${field}'`, 400, ErrorCode.MISSING_FIELD);
  }

  static invalidFormat(format: string, type: "source" | "destination"): AppError {
    return new AppError(`Invalid ${type} format: ${format}`, 400, ErrorCode.INVALID_FORMAT);
  }

  static fileTooLarge(maxSize: number): AppError {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return new AppError(
      `File too large. Maximum size is ${maxMB}MB`,
      413,
      ErrorCode.FILE_TOO_LARGE
    );
  }

  static methodNotAllowed(method: string): AppError {
    return new AppError(`Method ${method} not allowed`, 405, ErrorCode.METHOD_NOT_ALLOWED);
  }

  static rateLimited(): AppError {
    return new AppError("Too many requests. Please try again later.", 429, ErrorCode.RATE_LIMITED);
  }

  static conversionFailed(details?: string): AppError {
    const message = details ? `Conversion failed: ${details}` : "Conversion failed";
    return new AppError(message, 500, ErrorCode.CONVERSION_FAILED);
  }

  static fileReadError(): AppError {
    return new AppError("Failed to read output file", 500, ErrorCode.FILE_READ_ERROR);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_ERROR);
  }
}

/**
 * Send a standardized JSON error response.
 *
 * Handles AppError instances (uses their status code and error code),
 * regular Error instances (500 with message), and unknown errors (500 generic).
 * Logs unexpected errors with stack traces.
 *
 * @param res - Next.js response object
 * @param error - The error to send (AppError, Error, or unknown)
 * @param logger - Optional logger for error logging
 * @param requestId - Optional request ID to include in response
 */
export function sendError(
  res: NextApiResponse,
  error: AppError | Error | unknown,
  logger?: Logger,
  requestId?: string
): void {
  if (res.headersSent) {
    logger?.warn("Attempted to send error after headers sent");
    return;
  }

  let statusCode = 500;
  let message = "Internal server error";
  let code: string | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    // Log stack trace for unexpected errors
    logger?.error({ err: error }, "Unexpected error");
  } else {
    logger?.error({ err: error }, "Unknown error type");
  }

  const response: ErrorResponse = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(requestId && { requestId }),
  };

  res.status(statusCode).json(response);
}

/**
 * Type guard to check if an error is an AppError.
 * @param error - Unknown error to check
 * @returns True if error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safely extract an error message from an unknown error type.
 * @param error - Unknown error (could be Error, string, or anything)
 * @returns The error message string, or "Unknown error" if not extractable
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}
