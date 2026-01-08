/**
 * Document conversion API endpoint.
 *
 * POST /api/convert?from=FORMAT&to=FORMAT
 *
 * Accepts multipart form data with:
 * - file (required): The document to convert
 * - template (optional): Reference document for docx/odt/pptx styling
 *
 * Query parameters:
 * - from: Source format (markdown, gfm, html, epub, docx, latex, rst)
 * - to: Destination format (pdf, html, gfm, markdown, rst, rtf, docx)
 * - toc: Include table of contents (true/false)
 * - tocDepth: TOC depth (1-6)
 * - numberSections: Number section headings (true/false)
 * - noYaml: Disable YAML metadata parsing (true/false)
 * - embedResources: Embed images/resources in output (true/false)
 * - referenceLocation: Where to place reference links (document/section/block)
 * - figureCaptionPosition: Figure caption position (above/below)
 * - tableCaptionPosition: Table caption position (above/below)
 *
 * Returns the converted file as a download with appropriate Content-Type.
 *
 * @module pages/api/convert
 */

import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import { v4 as uuidv4 } from "uuid";
import { resolve, extname, basename } from "path";
import { unlink, createReadStream } from "fs";
import { spawn } from "child_process";
import sanitize from "sanitize-filename";

import appConfig, {
  isValidSourceFormat,
  isValidDestFormat,
  getDestFormat,
  IFormat,
} from "../../lib/config";
import { rateLimit } from "../../lib/rateLimit";
import { createRequestLogger, Logger } from "../../lib/logger";
import { AppError, sendError, getErrorMessage } from "../../lib/errors";

/** Disable Next.js body parsing to handle multipart form data with formidable */
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Get file extension for a format.
 * Uses the format's configured extension, falling back to the format name.
 */
function getExtension(format: string, destFormat?: IFormat): string {
  return destFormat?.ext ?? format;
}

/**
 * Get MIME type for a format.
 * Falls back to application/octet-stream for unknown formats.
 */
function getMimeType(destFormat?: IFormat): string {
  return destFormat?.mime ?? "application/octet-stream";
}

/**
 * Delete temporary files, logging any errors.
 * Silently ignores undefined paths.
 */
function cleanupFiles(logger: Logger, ...paths: (string | undefined)[]): void {
  for (const p of paths) {
    if (p) {
      unlink(p, (err) => {
        if (err) {
          logger.warn({ path: p, err }, "Failed to cleanup file");
        }
      });
    }
  }
}

/** Options passed to pandoc for conversion */
interface PandocOptions {
  templatePath?: string;
  toc?: boolean;
  tocDepth?: number;
  numberSections?: boolean;
  embedResources?: boolean;
  noYaml?: boolean;
  referenceLocation?: string;
  figureCaptionPosition?: string;
  tableCaptionPosition?: string;
}

/** Result from a pandoc conversion attempt */
interface PandocResult {
  success: boolean;
  error?: string;
}

/**
 * Execute pandoc to convert a document.
 *
 * @param logger - Logger for this request
 * @param src - Path to source file
 * @param dest - Path for output file
 * @param fromFormat - Pandoc source format
 * @param toFormat - Pandoc destination format
 * @param options - Additional conversion options
 * @returns Promise resolving to success/failure with optional error message
 */
async function runPandoc(
  logger: Logger,
  src: string,
  dest: string,
  fromFormat: string,
  toFormat: string,
  options: PandocOptions = {}
): Promise<PandocResult> {
  return new Promise((resolve) => {
    // Build format string with extensions
    let inputFormat = fromFormat;
    if (options.noYaml && (fromFormat === "markdown" || fromFormat === "gfm")) {
      inputFormat = `${fromFormat}-yaml_metadata_block`;
    }

    const args = [src, "-f", inputFormat];

    if (toFormat === "pdf") {
      args.push("-V", "geometry:margin=1in", "--pdf-engine=xelatex");
    } else {
      args.push("-t", toFormat);
    }

    if (
      options.templatePath &&
      (toFormat === "docx" || toFormat === "odt" || toFormat === "pptx")
    ) {
      args.push("--reference-doc", options.templatePath);
    }

    if (options.toc) {
      args.push("--toc");
      if (options.tocDepth) args.push("--toc-depth", String(options.tocDepth));
    }
    if (options.numberSections) args.push("--number-sections");
    if (options.embedResources) args.push("--embed-resources", "--standalone");
    if (options.referenceLocation) args.push("--reference-location", options.referenceLocation);
    if (options.figureCaptionPosition)
      args.push("--figure-caption-position", options.figureCaptionPosition);
    if (options.tableCaptionPosition)
      args.push("--table-caption-position", options.tableCaptionPosition);

    args.push("-o", dest);

    logger.info({ args }, "Running pandoc");

    let stderr = "";
    const proc = spawn("pandoc", args);

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      logger.error({ err }, "Pandoc process error");
      resolve({ success: false, error: err.message });
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        logger.info("Pandoc conversion successful");
        resolve({ success: true });
      } else {
        logger.error({ code, stderr }, "Pandoc conversion failed");
        resolve({
          success: false,
          error: stderr || `pandoc exited with code ${code}`,
        });
      }
    });
  });
}

function parseQueryString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseQueryBoolean(value: string | string[] | undefined): boolean {
  return value === "true";
}

function parseQueryNumber(value: string | string[] | undefined): number | undefined {
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const logger = createRequestLogger(req);
  logger.info("Convert request received");

  // Rate limiting
  if (!rateLimit(req, res)) {
    logger.warn("Rate limit exceeded");
    return;
  }

  if (req.method !== "POST") {
    sendError(res, AppError.methodNotAllowed(req.method ?? "unknown"), logger);
    return;
  }

  const from = parseQueryString(req.query.from);
  const to = parseQueryString(req.query.to);

  if (!from || !to) {
    sendError(res, AppError.badRequest("Query params 'from' and 'to' are required"), logger);
    return;
  }

  // Validate formats against allowed list
  if (!isValidSourceFormat(from)) {
    sendError(res, AppError.invalidFormat(from, "source"), logger);
    return;
  }
  if (!isValidDestFormat(to)) {
    sendError(res, AppError.invalidFormat(to, "destination"), logger);
    return;
  }

  const destFormat = getDestFormat(to);

  const options: PandocOptions = {
    toc: parseQueryBoolean(req.query.toc),
    tocDepth: parseQueryNumber(req.query.tocDepth),
    numberSections: parseQueryBoolean(req.query.numberSections),
    embedResources: parseQueryBoolean(req.query.embedResources),
    noYaml: parseQueryBoolean(req.query.noYaml),
    referenceLocation: parseQueryString(req.query.referenceLocation),
    figureCaptionPosition: parseQueryString(req.query.figureCaptionPosition),
    tableCaptionPosition: parseQueryString(req.query.tableCaptionPosition),
  };

  logger.info({ from, to, options }, "Conversion parameters");

  const uploadDir = resolve(process.cwd(), appConfig.uploadDir);
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: appConfig.maxFileSize,
    maxTotalFileSize: appConfig.maxTotalFileSize,
    filename: (_name, _ext, part) => {
      // Sanitize and generate safe filename
      const originalName = part.originalFilename ?? "";
      const safeName = sanitize(basename(originalName));
      const ext = extname(safeName);
      return `${uuidv4()}${ext}`;
    },
  });

  let filePath: string | undefined;
  let templatePath: string | undefined;
  let outputPath: string | undefined;

  try {
    const [, files] = await form.parse(req);

    const fileArr = files.file;
    const mainFile: FormidableFile | undefined = Array.isArray(fileArr) ? fileArr[0] : fileArr;
    const templateArr = files.template;
    const templateFile: FormidableFile | undefined = Array.isArray(templateArr)
      ? templateArr[0]
      : templateArr;

    if (!mainFile) {
      cleanupFiles(logger, templateFile?.filepath);
      sendError(res, AppError.missingField("file"), logger);
      return;
    }

    filePath = mainFile.filepath;
    templatePath = templateFile?.filepath;
    options.templatePath = templatePath;

    logger.info(
      { filePath, templatePath, originalName: mainFile.originalFilename },
      "Files received"
    );

    const ext = getExtension(to, destFormat);
    outputPath = resolve(uploadDir, `${uuidv4()}.${ext}`);

    const result = await runPandoc(logger, filePath, outputPath, from, to, options);

    if (!result.success) {
      cleanupFiles(logger, filePath, templatePath, outputPath);
      // Add hint for YAML parsing errors
      let errorMsg = result.error;
      if (errorMsg?.includes("YAML") && !options.noYaml) {
        errorMsg +=
          "\n\nTip: Try enabling 'Disable YAML Metadata' option (noYaml=true) if your file has problematic frontmatter.";
      }
      sendError(res, AppError.conversionFailed(errorMsg), logger);
      return;
    }

    const mimeType = getMimeType(destFormat);
    const filename = `converted.${ext}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = createReadStream(outputPath);
    stream.pipe(res);

    stream.on("close", () => {
      logger.info("Response sent, cleaning up");
      cleanupFiles(logger, filePath, templatePath, outputPath);
    });

    stream.on("error", (err) => {
      logger.error({ err }, "Stream error");
      cleanupFiles(logger, filePath, templatePath, outputPath);
      if (!res.headersSent) {
        sendError(res, AppError.fileReadError(), logger);
      }
    });
  } catch (err: unknown) {
    cleanupFiles(logger, filePath, templatePath, outputPath);

    // Check for formidable file size errors
    if (err instanceof Error && err.message.includes("maxFileSize")) {
      sendError(res, AppError.fileTooLarge(appConfig.maxFileSize), logger);
      return;
    }

    logger.error({ err }, "Form parsing error");
    sendError(
      res,
      AppError.badRequest(`Failed to parse form data: ${getErrorMessage(err)}`),
      logger
    );
  }
};

export default handler;
