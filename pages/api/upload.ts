import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { v4 as uuidv4 } from "uuid";
import { extname, basename, resolve } from "path";
import { unlink } from "fs";
import sanitize from "sanitize-filename";

import appConfig, { isValidSourceFormat } from "../../lib/config";
import { rateLimit } from "../../lib/rateLimit";
import { writeMetaFile, IStatus } from "../../lib/writeMetaFile";
import { convert } from "../../lib/convert";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Rate limiting
  if (!rateLimit(req, res)) return;

  const uploadDir = resolve(process.cwd(), appConfig.uploadDir);

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: appConfig.maxFileSize,
    maxTotalFileSize: appConfig.maxTotalFileSize,
    filename: (_name, _ext, part) => {
      const originalName = part.originalFilename || "";
      const safeName = sanitize(basename(originalName));
      const ext = extname(safeName);
      return `${uuidv4()}${ext}`;
    },
  });

  try {
    const [fields, files] = await form.parse(req);

    const format = Array.isArray(fields.format) ? fields.format[0] : fields.format;
    if (!format) {
      res.json({ success: false, error: "Destination file format not specified" });
      return;
    }

    const formatConfig = appConfig.formats.find((f) => f.value === format);
    if (!formatConfig) {
      res.json({ success: false, error: "Unknown destination file format specified" });
      return;
    }

    // Get uploaded files
    const uploadedFiles = files["files[0]"] || files.file;
    const mainFile = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;
    const templateFiles = files.template;
    const templateFile = Array.isArray(templateFiles) ? templateFiles[0] : templateFiles;

    if (!mainFile) {
      res.json({ success: false, error: "No file uploaded" });
      return;
    }

    const mainFilePath = mainFile.filepath;
    const mainFileName = mainFile.newFilename || "";
    const originalName = mainFile.originalFilename || "unknown";
    const templatePath = templateFile?.filepath;

    // Get options from fields
    const getField = (name: string) => {
      const val = fields[name];
      return Array.isArray(val) ? val[0] : val;
    };

    const sourceFormat = getField("sourceFormat");
    
    // Validate source format if provided
    if (sourceFormat && !isValidSourceFormat(sourceFormat)) {
      res.status(400).json({ success: false, error: `Invalid source format: ${sourceFormat}` });
      unlink(mainFilePath, () => {});
      if (templatePath) unlink(templatePath, () => {});
      return;
    }

    const toc = getField("toc") === "true";
    const tocDepth = getField("tocDepth") ? parseInt(getField("tocDepth")!, 10) : undefined;
    const numberSections = getField("numberSections") === "true";
    const embedResources = getField("embedResources") === "true";
    const referenceLocation = getField("referenceLocation");
    const figureCaptionPosition = getField("figureCaptionPosition");
    const tableCaptionPosition = getField("tableCaptionPosition");

    const status: IStatus = {
      name: mainFileName,
      originalName,
      format: formatConfig.value,
      sourceFormat,
      templatePath,
      toc,
      tocDepth,
      numberSections,
      embedResources,
      referenceLocation,
      figureCaptionPosition,
      tableCaptionPosition,
      date: new Date().toISOString(),
    };

    const err = await writeMetaFile(status);
    if (err) {
      res.json({ success: false, error: "Writing a meta file failed" });
      unlink(mainFilePath, () => {});
      if (templatePath) unlink(templatePath, () => {});
      return;
    }

    res.json({ success: true, name: mainFileName });

    // Start conversion
    convert(
      mainFilePath,
      `${mainFilePath}.${formatConfig.ext || formatConfig.value}`,
      formatConfig.value,
      status
    );
  } catch (err) {
    res.json({ success: false, error: "Failed to parse form data" });
  }
};

export default handler;
