import { useState, useCallback, FC, useRef } from "react";
import axios from "axios";

import { Button, FormControl, Checkbox, Select } from "./ui";
import { FileUploader } from "./FileUploader";
import { IFileFormat, FileFormatSelect, formats } from "./FileFormatSelect";
import { ISourceFormat, SourceFormatSelect, sourceFormats } from "./SourceFormatSelect";
import { AxiosProgressEvent } from "axios";

export interface ConversionResult {
  blob: Blob;
  filename: string;
}

interface IProps {
  onConvertComplete(_result: ConversionResult): void;
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

export const UploadStep: FC<IProps> = ({ onConvertComplete }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [sourceFormat, setSourceFormat] = useState<ISourceFormat>(
    sourceFormats[0] ?? { value: "markdown", label: "Markdown" }
  );
  const [destFormat, setDestFormat] = useState<IFileFormat>(
    formats[0] ?? { value: "docx", label: "Word (.docx)" }
  );
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Advanced options
  const [toc, setToc] = useState(false);
  const [tocDepth, setTocDepth] = useState("3");
  const [numberSections, setNumberSections] = useState(false);
  const [embedResources, setEmbedResources] = useState(false);
  const [referenceLocation, setReferenceLocation] = useState("document");
  const [figureCaptionPosition, setFigureCaptionPosition] = useState("below");
  const [tableCaptionPosition, setTableCaptionPosition] = useState("above");

  const handleDrop = useCallback((acceptedFiles: File[], rejectedFiles: File[]) => {
    if (rejectedFiles.length > 0) {
      setErrorMessage(rejectedFiles.length > 1 ? "Too many files" : "Something wrong happened");
      return;
    }
    const firstFile = acceptedFiles[0];
    if (firstFile) {
      setSelectedFile(firstFile);
      setErrorMessage("");
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file first");
      return;
    }

    setConverting(true);
    setErrorMessage("");
    setProgress(0);

    // Build query params for /api/convert
    const params = new URLSearchParams({
      from: sourceFormat.value,
      to: destFormat.value,
    });
    if (toc) {
      params.set("toc", "true");
      params.set("tocDepth", tocDepth);
    }
    if (numberSections) params.set("numberSections", "true");
    if (embedResources) params.set("embedResources", "true");
    params.set("referenceLocation", referenceLocation);
    params.set("figureCaptionPosition", figureCaptionPosition);
    params.set("tableCaptionPosition", tableCaptionPosition);

    // Build form data with file and optional template
    const data = new FormData();
    data.append("file", selectedFile);
    if (templateFile) {
      data.append("template", templateFile);
    }

    try {
      const response = await axios.post(`/api/convert?${params.toString()}`, data, {
        onUploadProgress: (e: AxiosProgressEvent) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1));
          setProgress(pct < 100 ? pct : null); // null when upload done, waiting for conversion
        },
        responseType: "blob",
      });

      // Check if response is an error JSON
      const contentType = response.headers["content-type"];
      if (contentType?.includes("application/json")) {
        // Error response
        const text = await response.data.text();
        const json = JSON.parse(text);
        setErrorMessage(json.error || "Conversion failed");
        setConverting(false);
        setProgress(null);
        return;
      }

      // Get filename from Content-Disposition header or generate one
      const disposition = response.headers["content-disposition"];
      let filename = `converted.${destFormat.ext || destFormat.value}`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Pass result to parent - don't download yet
      setConverting(false);
      setProgress(null);
      onConvertComplete({ blob: response.data, filename });
    } catch (err: any) {
      setConverting(false);
      setProgress(null);

      // Try to extract error message from response
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setErrorMessage(json.error || "Conversion failed");
        } catch {
          setErrorMessage("Conversion failed");
        }
      } else {
        setErrorMessage(err.response?.data?.error || "Conversion failed");
      }
    }
  }, [
    selectedFile,
    sourceFormat,
    destFormat,
    templateFile,
    toc,
    tocDepth,
    numberSections,
    embedResources,
    referenceLocation,
    figureCaptionPosition,
    tableCaptionPosition,
    onConvertComplete,
  ]);

  const handleRetry = useCallback(() => {
    setProgress(null);
    setErrorMessage("");
    setSelectedFile(null);
    setConverting(false);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
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
  const showAdvancedOptions =
    sourceFormat.value.includes("markdown") || sourceFormat.value === "gfm";

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

      {/* File Selection */}
      {selectedFile ? (
        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="tertiary"
              size="compact"
              onClick={handleClearFile}
              disabled={converting}
            >
              Change
            </Button>
          </div>
        </div>
      ) : (
        <FileUploader
          multiple={false}
          onDrop={handleDrop}
          onRetry={handleRetry}
          progressAmount={progress}
          progressMessage={progress !== null ? `Uploading... ${progress}%` : ""}
          errorMessage={errorMessage}
        />
      )}

      {/* Error message when file is selected */}
      {selectedFile && errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}

      {/* Convert Button */}
      <div className="pt-4">
        <Button onClick={handleConvert} disabled={!selectedFile || converting} className="w-full">
          {converting
            ? progress !== null
              ? `Uploading... ${progress}%`
              : "Converting..."
            : "Convert"}
        </Button>
      </div>
    </div>
  );
};
