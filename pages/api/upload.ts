import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { v4 as uuidv4 } from "uuid";
import { extname, resolve } from "path";
import { unlink } from "fs";

import appConfig from "../../lib/config";
import { writeMetaFile, IStatus } from "../../lib/writeMetaFile";
import { convert } from "../../lib/convert";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // use formidable to parse form data
  const form = new IncomingForm();
  (form as any).uploadDir = appConfig.uploadDir;
  (form as any).keepExtensions = true;
  (form as any).multiples = true;

  let originalName: string = "";
  let mainFilePath: string = "";
  let mainFileName: string = "";
  let templatePath: string | undefined;

  form.on("fileBegin", (fieldName: string, file: any) => {
    const ext = extname(file.name);
    const name = `${uuidv4()}${ext}`;
    
    if (fieldName === "template") {
      file.name = name;
      file.path = resolve((form as any).uploadDir, name);
      templatePath = file.path;
    } else {
      // Main file
      originalName = file.name;
      file.name = name;
      file.path = resolve((form as any).uploadDir, name);
      mainFilePath = file.path;
      mainFileName = name;
    }
  });

  form.parse(req, (err, fields, filesMap) => {
    if (err) {
      res.json({
        success: false,
        error: err,
      });
      return;
    }
    if (!fields || typeof fields.format !== "string") {
      res.json({
        success: false,
        error: "Destination file format not specified",
      });
      return;
    }
    const format = appConfig.formats.find((f) => f.value === fields.format);
    if (!format) {
      res.json({
        success: false,
        error: "Unknown destination file format specified",
      });
      return;
    }

    // Get source format (optional)
    const sourceFormat = typeof fields.sourceFormat === "string" ? fields.sourceFormat : undefined;

    // Get advanced options
    const toc = fields.toc === "true";
    const tocDepth = typeof fields.tocDepth === "string" ? parseInt(fields.tocDepth, 10) : undefined;
    const numberSections = fields.numberSections === "true";
    const embedResources = fields.embedResources === "true";
    const referenceLocation = typeof fields.referenceLocation === "string" ? fields.referenceLocation : undefined;

    if (!mainFilePath) {
      res.json({
        success: false,
        error: "No file uploaded",
      });
      return;
    }

    // write meta file
    const status: IStatus = {
      name: mainFileName,
      originalName,
      format: format.value,
      sourceFormat,
      templatePath,
      toc,
      tocDepth,
      numberSections,
      embedResources,
      referenceLocation,
      date: new Date().toISOString(),
    };
    writeMetaFile(status).then((err) => {
      // clean up on error
      if (err) {
        res.json({
          success: false,
          error: "Writing a meta file failed",
        });
        unlink(mainFilePath, (_err) => {});
        if (templatePath) unlink(templatePath, (_err) => {});
        return;
      }

      // return the name of the uploaded file
      res.json({
        success: true,
        name: mainFileName,
      });

      // start conversion
      convert(
        mainFilePath,
        `${mainFilePath}.${format.ext || format.value}`,
        format.value,
        status
      );
    });
  });
};

export default handler;
