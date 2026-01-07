import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { v4 as uuidv4 } from "uuid";
import { resolve, extname, basename } from "path";
import { unlink, createReadStream } from "fs";
import { spawn } from "child_process";
import sanitize from "sanitize-filename";

import appConfig, { isValidSourceFormat, isValidDestFormat, getDestFormat } from "../../lib/config";
import { rateLimit } from "../../lib/rateLimit";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getExtension(format: string, destFormat?: { ext?: string }): string {
  return destFormat?.ext || format;
}

function getMimeType(destFormat?: { mime?: string }): string {
  return destFormat?.mime || "application/octet-stream";
}

function cleanupFiles(...paths: (string | undefined)[]): void {
  for (const p of paths) {
    if (p) unlink(p, () => {});
  }
}

interface PandocOptions {
  templatePath?: string;
  toc?: boolean;
  tocDepth?: number;
  numberSections?: boolean;
  embedResources?: boolean;
  referenceLocation?: string;
  figureCaptionPosition?: string;
  tableCaptionPosition?: string;
}

async function runPandoc(
  src: string,
  dest: string,
  fromFormat: string,
  toFormat: string,
  options: PandocOptions = {}
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [src, "-f", fromFormat];

    if (toFormat === "pdf") {
      args.push("-V", "geometry:margin=1in", "--pdf-engine=xelatex");
    } else {
      args.push("-t", toFormat);
    }

    if (options.templatePath && (toFormat === "docx" || toFormat === "odt")) {
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

    let stderr = "";
    const proc = spawn("pandoc", args);

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });

    proc.on("exit", (code) => {
      resolve(
        code === 0
          ? { success: true }
          : { success: false, error: stderr || `pandoc exited with code ${code}` }
      );
    });
  });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Rate limiting
  if (!rateLimit(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const {
    from,
    to,
    toc,
    tocDepth,
    numberSections,
    embedResources,
    referenceLocation,
    figureCaptionPosition,
    tableCaptionPosition,
  } = req.query;
  if (typeof from !== "string" || typeof to !== "string") {
    res.status(400).json({ success: false, error: "Query params 'from' and 'to' are required" });
    return;
  }

  // Validate formats against allowed list
  if (!isValidSourceFormat(from)) {
    res.status(400).json({ success: false, error: `Invalid source format: ${from}` });
    return;
  }
  if (!isValidDestFormat(to)) {
    res.status(400).json({ success: false, error: `Invalid destination format: ${to}` });
    return;
  }

  const destFormat = getDestFormat(to);

  const options: PandocOptions = {
    toc: toc === "true",
    tocDepth: typeof tocDepth === "string" ? parseInt(tocDepth, 10) : undefined,
    numberSections: numberSections === "true",
    embedResources: embedResources === "true",
    referenceLocation: typeof referenceLocation === "string" ? referenceLocation : undefined,
    figureCaptionPosition:
      typeof figureCaptionPosition === "string" ? figureCaptionPosition : undefined,
    tableCaptionPosition:
      typeof tableCaptionPosition === "string" ? tableCaptionPosition : undefined,
  };

  const uploadDir = resolve(process.cwd(), appConfig.uploadDir);
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: appConfig.maxFileSize,
    maxTotalFileSize: appConfig.maxTotalFileSize,
    filename: (_name, _ext, part) => {
      // Sanitize and generate safe filename
      const originalName = part.originalFilename || "";
      const safeName = sanitize(basename(originalName));
      const ext = extname(safeName);
      return `${uuidv4()}${ext}`;
    },
  });

  try {
    const [, files] = await form.parse(req);

    const fileArr = files.file;
    const mainFile = Array.isArray(fileArr) ? fileArr[0] : fileArr;
    const templateArr = files.template;
    const templateFile = Array.isArray(templateArr) ? templateArr[0] : templateArr;

    if (!mainFile) {
      cleanupFiles(templateFile?.filepath);
      res.status(400).json({ success: false, error: "'file' field is required" });
      return;
    }

    const filePath = mainFile.filepath;
    const templatePath = templateFile?.filepath;
    options.templatePath = templatePath;

    const ext = getExtension(to, destFormat);
    const outputPath = resolve(uploadDir, `${uuidv4()}.${ext}`);

    const result = await runPandoc(filePath, outputPath, from, to, options);

    if (!result.success) {
      cleanupFiles(filePath, templatePath, outputPath);
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    const mimeType = getMimeType(destFormat);
    const filename = `converted.${ext}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = createReadStream(outputPath);
    stream.pipe(res);

    stream.on("close", () => cleanupFiles(filePath, templatePath, outputPath));
    stream.on("error", () => {
      cleanupFiles(filePath, templatePath, outputPath);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to read output file" });
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: "Failed to parse form data" });
  }
};

export default handler;
