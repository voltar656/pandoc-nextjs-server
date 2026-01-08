import { describe, it, expect, vi } from "vitest";
import { AppError, ErrorCode, isAppError, getErrorMessage } from "../../lib/errors";

describe("errors", () => {
  describe("AppError", () => {
    it("creates error with correct properties", () => {
      const error = new AppError("test message", 400, ErrorCode.BAD_REQUEST);
      expect(error.message).toBe("test message");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
      expect(error.name).toBe("AppError");
    });

    it("is instanceof Error", () => {
      const error = new AppError("test", 400, ErrorCode.BAD_REQUEST);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe("AppError static factories", () => {
    it("badRequest creates 400 error", () => {
      const error = AppError.badRequest("bad request");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it("validationError creates 400 error with validation code", () => {
      const error = AppError.validationError("invalid data");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it("missingField creates 400 error with field name", () => {
      const error = AppError.missingField("email");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.MISSING_FIELD);
      expect(error.message).toContain("email");
    });

    it("invalidFormat creates 400 error with format details", () => {
      const error = AppError.invalidFormat("xyz", "source");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.INVALID_FORMAT);
      expect(error.message).toContain("xyz");
      expect(error.message).toContain("source");
    });

    it("fileTooLarge creates 413 error with size in MB", () => {
      const error = AppError.fileTooLarge(50 * 1024 * 1024);
      expect(error.statusCode).toBe(413);
      expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(error.message).toContain("50MB");
    });

    it("methodNotAllowed creates 405 error", () => {
      const error = AppError.methodNotAllowed("GET");
      expect(error.statusCode).toBe(405);
      expect(error.code).toBe(ErrorCode.METHOD_NOT_ALLOWED);
      expect(error.message).toContain("GET");
    });

    it("rateLimited creates 429 error", () => {
      const error = AppError.rateLimited();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    });

    it("conversionFailed creates 500 error", () => {
      const error = AppError.conversionFailed("pandoc crashed");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.CONVERSION_FAILED);
      expect(error.message).toContain("pandoc crashed");
    });

    it("conversionFailed works without details", () => {
      const error = AppError.conversionFailed();
      expect(error.message).toBe("Conversion failed");
    });

    it("fileReadError creates 500 error", () => {
      const error = AppError.fileReadError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.FILE_READ_ERROR);
    });

    it("internal creates 500 error", () => {
      const error = AppError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe("isAppError", () => {
    it("returns true for AppError instances", () => {
      expect(isAppError(new AppError("test", 400, ErrorCode.BAD_REQUEST))).toBe(true);
      expect(isAppError(AppError.badRequest("test"))).toBe(true);
    });

    it("returns false for regular errors", () => {
      expect(isAppError(new Error("test"))).toBe(false);
    });

    it("returns false for non-errors", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError("string")).toBe(false);
      expect(isAppError({ message: "fake" })).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("extracts message from Error", () => {
      expect(getErrorMessage(new Error("test error"))).toBe("test error");
    });

    it("extracts message from AppError", () => {
      expect(getErrorMessage(AppError.badRequest("bad"))).toBe("bad");
    });

    it("returns string as-is", () => {
      expect(getErrorMessage("string error")).toBe("string error");
    });

    it("returns 'Unknown error' for other types", () => {
      expect(getErrorMessage(null)).toBe("Unknown error");
      expect(getErrorMessage(undefined)).toBe("Unknown error");
      expect(getErrorMessage(123)).toBe("Unknown error");
      expect(getErrorMessage({ foo: "bar" })).toBe("Unknown error");
    });
  });
});
