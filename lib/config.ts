/**
 * Destination format configuration for pandoc conversion.
 */
export interface IFormat {
  /** Display label for UI */
  label: string;
  /** Pandoc format identifier */
  value: string;
  /** File extension (defaults to value if not specified) */
  ext?: string;
  /** MIME type for Content-Type header */
  mime?: string;
}

// File upload limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB (file + template)

const config = {
  uploadDir: "uploads",
  maxFileSize: MAX_FILE_SIZE,
  maxTotalFileSize: MAX_TOTAL_SIZE,
  sourceFormats: [
    { label: "Markdown (.md)", value: "markdown" },
    { label: "GitHub-Flavored Markdown (.md)", value: "gfm" },
    { label: "HTML (.html)", value: "html" },
    { label: "EPUB (.epub)", value: "epub" },
    { label: "Microsoft Word (.docx)", value: "docx" },
    { label: "LaTeX (.tex)", value: "latex" },
    { label: "reStructuredText (.rst)", value: "rst" },
  ],
  formats: [
    { label: "Adobe PDF (.pdf)", value: "pdf", mime: "application/pdf" },
    { label: "HTML (.html)", value: "html", mime: "text/html" },
    { label: "GitHub-Flavored Markdown (.md)", value: "gfm", ext: "md", mime: "text/plain" },
    { label: "Pandoc's Markdown (.md)", value: "markdown", ext: "md", mime: "text/plain" },
    { label: "reStructuredText (.rst)", value: "rst", mime: "text/plain" },
    { label: "Rich Text Format (.rtf)", value: "rtf", mime: "application/rtf" },
    {
      label: "Microsoft Word (.docx)",
      value: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    {
      label: "Microsoft PowerPoint (.pptx)",
      value: "pptx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  ] as IFormat[],
};

/**
 * Check if a format string is a valid source format for pandoc input.
 * @param format - The format identifier to validate
 * @returns True if the format is in the allowed source formats list
 */
export function isValidSourceFormat(format: string): boolean {
  return config.sourceFormats.some((f) => f.value === format);
}

/**
 * Check if a format string is a valid destination format for pandoc output.
 * @param format - The format identifier to validate
 * @returns True if the format is in the allowed destination formats list
 */
export function isValidDestFormat(format: string): boolean {
  return config.formats.some((f) => f.value === format);
}

/**
 * Get the full format configuration for a destination format.
 * @param format - The format identifier to look up
 * @returns The format configuration, or undefined if not found
 */
export function getDestFormat(format: string): IFormat | undefined {
  return config.formats.find((f) => f.value === format);
}

export default config;
