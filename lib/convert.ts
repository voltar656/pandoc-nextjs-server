import { unlink } from "fs";

import { pandoc } from "./pandoc";
import { writeMetaFile, IStatus } from "./writeMetaFile";
import { parseScrapbox } from "./scrapbox";

export async function convert(
  src: string,
  dest: string,
  format: string,
  status: IStatus
): Promise<void> {
  // check if source is a JSON file exported from Scrapbox
  const sb = await parseScrapbox(src);
  if (sb) {
    status.scrapbox = true;
    writeMetaFile(status);
    return;
  }

  // Build pandoc args
  const args: string[] = [];
  if (status.sourceFormat) {
    args.push("-f", status.sourceFormat);
  }
  if (status.templatePath && (format === "docx" || format === "odt")) {
    args.push("--reference-doc", status.templatePath);
  }
  // Advanced options
  if (status.toc) {
    args.push("--toc");
    if (status.tocDepth) {
      args.push("--toc-depth", String(status.tocDepth));
    }
  }
  if (status.numberSections) {
    args.push("--number-sections");
  }
  if (status.embedResources) {
    args.push("--embed-resources", "--standalone");
  }
  if (status.referenceLocation) {
    args.push("--reference-location", status.referenceLocation);
  }
  if (status.figureCaptionPosition) {
    args.push("--figure-caption-position", status.figureCaptionPosition);
  }
  if (status.tableCaptionPosition) {
    args.push("--table-caption-position", status.tableCaptionPosition);
  }

  // convert with pandoc
  return pandoc(src, dest, format, args).then((res) => {
    status.success = res.success;
    status.error = res.error;
    status.result = res.result;

    // update meta file
    writeMetaFile(status);

    // clean up source file
    unlink(src, (_err) => {
      // do nothing on clean up error
    });
  });
}
