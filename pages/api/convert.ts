import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
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

// MIME types for common output formats
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

// File extensions for formats
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
    if (p) {
      unlink(p, () => {});
    }
  }
}

async function runPandoc(
  src: string,
  dest: string,
  fromFormat: string,
  toFormat: string,
  templatePath?: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [src, "-f", fromFormat];

    // Handle PDF output specially
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

    // Add reference doc for docx/odt
    if (templatePath && (toFormat === "docx" || toFormat === "odt")) {
      args.push("--reference-doc", templatePath);
    }

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
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr || `pandoc exited with code ${code}` });
      }
    });
  });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only accept POST
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  // Parse query params
  const { from, to } = req.query;
  if (typeof from !== "string" || typeof to !== "string") {
    res.status(400).json({
      success: false,
      error: "Query params 'from' and 'to' are required",
    });
    return;
  }

  // Parse multipart form
  const form = new IncomingForm();
  (form as any).uploadDir = appConfig.uploadDir;
  (form as any).keepExtensions = true;

  // Track file paths for uploaded files
  let filePath: string | undefined;
  let templatePath: string | undefined;

  form.on("fileBegin", (name: string, file: any) => {
    const ext = extname(file.name);
    const newName = `${uuidv4()}${ext}`;
    file.name = newName;
    file.path = resolve(appConfig.uploadDir, newName);
    
    if (name === "file") {
      filePath = file.path;
    } else if (name === "template") {
      templatePath = file.path;
    }
  });

  form.parse(req, async (err) => {
    if (err) {
      res.status(400).json({ success: false, error: "Failed to parse form data" });
      return;
    }

    if (!filePath) {
      cleanupFiles(templatePath);
      res.status(400).json({ success: false, error: "'file' field is required" });
      return;
    }

    // Generate output path
    const ext = getExtension(to);
    const outputPath = resolve(appConfig.uploadDir, `${uuidv4()}.${ext}`);

    // Run pandoc
    const result = await runPandoc(filePath, outputPath, from, to, templatePath);

    if (!result.success) {
      cleanupFiles(filePath, templatePath, outputPath);
      res.status(500).json({ success: false, error: result.error });
      return;
    }

    // Stream result back
    const mimeType = getMimeType(to);
    const filename = `converted.${ext}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = createReadStream(outputPath);
    stream.pipe(res);

    stream.on("close", () => {
      cleanupFiles(filePath, templatePath, outputPath);
    });

    stream.on("error", () => {
      cleanupFiles(filePath, templatePath, outputPath);
      res.status(500).json({ success: false, error: "Failed to read output file" });
    });
  });
};

export default handler;
