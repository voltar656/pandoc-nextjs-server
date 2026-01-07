import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { v4 as uuidv4 } from "uuid";
import { resolve, extname } from "path";
import { unlink, createReadStream } from "fs";
import { spawn } from "child_process";

import appConfig from "../../lib/config";

export const config = {
  api: {
    bodyParser: false,
  },
};

const mimeTypes: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  pdf: "application/pdf",
  html: "text/html",
  markdown: "text/plain",
  gfm: "text/plain",
  rst: "text/plain",
  rtf: "application/rtf",
  epub: "application/epub+zip",
  latex: "application/x-latex",
  txt: "text/plain",
};

const extensions: Record<string, string> = {
  markdown: "md",
  gfm: "md",
  html: "html",
  latex: "tex",
};

function getExtension(format: string): string {
  return extensions[format] || format;
}

function getMimeType(format: string): string {
  return mimeTypes[format] || "application/octet-stream";
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
      args.push(
        "-V", "documentclass=ltjarticle",
        "-V", "classoption=a4j",
        "-V", "geometry:margin=1in",
        "--pdf-engine=lualatex"
      );
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
    if (options.figureCaptionPosition) args.push("--figure-caption-position", options.figureCaptionPosition);
    if (options.tableCaptionPosition) args.push("--table-caption-position", options.tableCaptionPosition);

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
      resolve(code === 0 ? { success: true } : { success: false, error: stderr || `pandoc exited with code ${code}` });
    });
  });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const { from, to, toc, tocDepth, numberSections, embedResources, referenceLocation, figureCaptionPosition, tableCaptionPosition } = req.query;
  if (typeof from !== "string" || typeof to !== "string") {
    res.status(400).json({ success: false, error: "Query params 'from' and 'to' are required" });
    return;
  }

  const options: PandocOptions = {
    toc: toc === "true",
    tocDepth: typeof tocDepth === "string" ? parseInt(tocDepth, 10) : undefined,
    numberSections: numberSections === "true",
    embedResources: embedResources === "true",
    referenceLocation: typeof referenceLocation === "string" ? referenceLocation : undefined,
    figureCaptionPosition: typeof figureCaptionPosition === "string" ? figureCaptionPosition : undefined,
    tableCaptionPosition: typeof tableCaptionPosition === "string" ? tableCaptionPosition : undefined,
  };

  const uploadDir = resolve(process.cwd(), appConfig.uploadDir);
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    filename: (_name, _ext, part) => {
      const ext = extname(part.originalFilename || "");
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

    const ext = getExtension(to);
    const outputPath = resolve(uploadDir, `${uuidv4()}.${ext}`);

    const result = await runPandoc(filePath, outputPath, from, to, options);

    if (!result.success) {
      cleanupFiles(filePath, templatePath, outputPath);
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    const mimeType = getMimeType(to);
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
