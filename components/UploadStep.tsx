import { useState, useCallback, FC, useRef } from "react";
import axios from "axios";

import { Button, FormControl, Checkbox, Select } from "./ui";
import { FileUploader } from "./FileUploader";
import { IFileFormat, FileFormatSelect, formats } from "./FileFormatSelect";
import { ISourceFormat, SourceFormatSelect, sourceFormats } from "./SourceFormatSelect";

interface IUploadResult {
  success: boolean;
  name: string;
}

interface IProps {
  onUpload(result: IUploadResult): void;
}

const referenceLocationOptions = [
  { value: "document", label: "End of document" },
  { value: "section", label: "End of section" },
  { value: "block", label: "End of block" },
];

const captionPositionOptions = [
  { value: "below", label: "Below" },
  { value: "above", label: "Above" },
];

const tocDepthOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

export const UploadStep: FC<IProps> = ({ onUpload }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [sourceFormat, setSourceFormat] = useState<ISourceFormat>(sourceFormats[0]);
  const [destFormat, setDestFormat] = useState<IFileFormat>(formats[0]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Advanced options
  const [toc, setToc] = useState(false);
  const [tocDepth, setTocDepth] = useState("3");
  const [numberSections, setNumberSections] = useState(false);
  const [embedResources, setEmbedResources] = useState(false);
  const [referenceLocation, setReferenceLocation] = useState("document");
  const [figureCaptionPosition, setFigureCaptionPosition] = useState("below");
  const [tableCaptionPosition, setTableCaptionPosition] = useState("above");

  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: File[]) => {
      if (rejectedFiles.length > 0) {
        setErrorMessage(rejectedFiles.length > 1 ? "Too many files" : "Something wrong happened");
        return;
      }

      const data = new FormData();
      acceptedFiles.forEach((file, i) => {
        data.append(`files[${i}]`, file);
      });
      data.append("format", destFormat.value);
      data.append("sourceFormat", sourceFormat.value);
      if (templateFile) {
        data.append("template", templateFile);
      }
      if (toc) {
        data.append("toc", "true");
        data.append("tocDepth", tocDepth);
      }
      if (numberSections) data.append("numberSections", "true");
      if (embedResources) data.append("embedResources", "true");
      data.append("referenceLocation", referenceLocation);
      data.append("figureCaptionPosition", figureCaptionPosition);
      data.append("tableCaptionPosition", tableCaptionPosition);

      axios
        .post("/api/upload", data, {
          onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
          responseType: "json",
        })
        .then((res) => {
          if (!res?.data?.success) {
            setErrorMessage(res?.data?.error || "Something wrong happened");
            return;
          }
          onUpload(res.data);
        })
        .catch(() => setErrorMessage("Upload failed"));

      setErrorMessage("");
    },
    [onUpload, destFormat, sourceFormat, templateFile, toc, tocDepth, numberSections, embedResources, referenceLocation, figureCaptionPosition, tableCaptionPosition]
  );

  const handleRetry = useCallback(() => {
    setProgress(null);
    setErrorMessage("");
  }, []);

  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateFile(e.target.files?.[0] || null);
  }, []);

  const handleTemplateClear = useCallback(() => {
    setTemplateFile(null);
    if (templateInputRef.current) templateInputRef.current.value = "";
  }, []);

  const showTemplateOption = destFormat.value === "docx" || destFormat.value === "odt";
  const showAdvancedOptions = sourceFormat.value.includes("markdown") || sourceFormat.value === "gfm";

  return (
    <div className="space-y-4">
      <FormControl label="Source file format:">
        <SourceFormatSelect onSelect={setSourceFormat} />
      </FormControl>

      <FormControl label="Destination file format:">
        <FileFormatSelect onSelect={setDestFormat} />
      </FormControl>

      {showTemplateOption && (
        <FormControl label="Template (optional):" caption="Reference document for styling">
          <div className="flex items-center gap-2">
            <input
              ref={templateInputRef}
              type="file"
              accept=".docx,.odt"
              onChange={handleTemplateChange}
              className="text-sm text-gray-600"
            />
            {templateFile && (
              <Button variant="tertiary" size="compact" onClick={handleTemplateClear}>
                Clear
              </Button>
            )}
          </div>
        </FormControl>
      )}

      {showAdvancedOptions && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>
          <div className="space-y-3">
            <div>
              <Checkbox
                label="Table of Contents"
                checked={toc}
                onChange={(e) => setToc(e.target.checked)}
              />
              {toc && (
                <div className="ml-6 mt-2 w-24">
                  <FormControl label="TOC Depth:">
                    <Select
                      options={tocDepthOptions}
                      value={tocDepth}
                      onChange={(e) => setTocDepth(e.target.value)}
                    />
                  </FormControl>
                </div>
              )}
            </div>
            <Checkbox
              label="Numbered Sections"
              checked={numberSections}
              onChange={(e) => setNumberSections(e.target.checked)}
            />
            <Checkbox
              label="Embed Resources"
              checked={embedResources}
              onChange={(e) => setEmbedResources(e.target.checked)}
            />
            <FormControl label="Reference Links Location:">
              <Select
                options={referenceLocationOptions}
                value={referenceLocation}
                onChange={(e) => setReferenceLocation(e.target.value)}
              />
            </FormControl>
            <FormControl label="Figure Caption Position:">
              <Select
                options={captionPositionOptions}
                value={figureCaptionPosition}
                onChange={(e) => setFigureCaptionPosition(e.target.value)}
              />
            </FormControl>
            <FormControl label="Table Caption Position:">
              <Select
                options={captionPositionOptions}
                value={tableCaptionPosition}
                onChange={(e) => setTableCaptionPosition(e.target.value)}
              />
            </FormControl>
          </div>
        </div>
      )}

      <FileUploader
        multiple={false}
        onDrop={handleDrop}
        onRetry={handleRetry}
        progressAmount={progress}
        progressMessage={progress ? `Uploading... ${progress}% of 100%` : ""}
        errorMessage={errorMessage}
      />
    </div>
  );
};
