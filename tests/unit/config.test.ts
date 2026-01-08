import { describe, it, expect } from "vitest";
import config, { isValidSourceFormat, isValidDestFormat, getDestFormat } from "../../lib/config";

describe("config", () => {
  describe("isValidSourceFormat", () => {
    it("returns true for valid source formats", () => {
      expect(isValidSourceFormat("markdown")).toBe(true);
      expect(isValidSourceFormat("gfm")).toBe(true);
      expect(isValidSourceFormat("html")).toBe(true);
      expect(isValidSourceFormat("docx")).toBe(true);
    });

    it("returns false for invalid source formats", () => {
      expect(isValidSourceFormat("invalid")).toBe(false);
      expect(isValidSourceFormat("")).toBe(false);
      expect(isValidSourceFormat("pdf")).toBe(false); // pdf is dest only
    });
  });

  describe("isValidDestFormat", () => {
    it("returns true for valid destination formats", () => {
      expect(isValidDestFormat("pdf")).toBe(true);
      expect(isValidDestFormat("html")).toBe(true);
      expect(isValidDestFormat("docx")).toBe(true);
      expect(isValidDestFormat("pptx")).toBe(true);
      expect(isValidDestFormat("markdown")).toBe(true);
    });

    it("returns false for invalid destination formats", () => {
      expect(isValidDestFormat("invalid")).toBe(false);
      expect(isValidDestFormat("")).toBe(false);
      expect(isValidDestFormat("epub")).toBe(false); // epub is source only
    });
  });

  describe("getDestFormat", () => {
    it("returns format config for valid formats", () => {
      const pdf = getDestFormat("pdf");
      expect(pdf).toBeDefined();
      expect(pdf?.mime).toBe("application/pdf");
      expect(pdf?.value).toBe("pdf");

      const docx = getDestFormat("docx");
      expect(docx).toBeDefined();
      expect(docx?.mime).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });

    it("returns undefined for invalid formats", () => {
      expect(getDestFormat("invalid")).toBeUndefined();
      expect(getDestFormat("")).toBeUndefined();
    });

    it("returns correct extension overrides", () => {
      const gfm = getDestFormat("gfm");
      expect(gfm?.ext).toBe("md"); // gfm uses .md extension

      const markdown = getDestFormat("markdown");
      expect(markdown?.ext).toBe("md");
    });
  });

  describe("config values", () => {
    it("has reasonable file size limits", () => {
      expect(config.maxFileSize).toBe(50 * 1024 * 1024); // 50MB
      expect(config.maxTotalFileSize).toBe(100 * 1024 * 1024); // 100MB
    });

    it("has upload directory configured", () => {
      expect(config.uploadDir).toBe("uploads");
    });

    it("has source formats defined", () => {
      expect(config.sourceFormats.length).toBeGreaterThan(0);
      expect(config.sourceFormats.every((f) => f.label && f.value)).toBe(true);
    });

    it("has destination formats with MIME types", () => {
      expect(config.formats.length).toBeGreaterThan(0);
      expect(config.formats.every((f) => f.label && f.value && f.mime)).toBe(true);
    });
  });
});
