import { useState, useCallback, FC, useRef } from "react";
import axios from "axios";
import { FormControl } from "baseui/form-control";
import { FileUploader } from "baseui/file-uploader";
import { Button } from "baseui/button";
import { Checkbox, LABEL_PLACEMENT } from "baseui/checkbox";
import { Select, Value } from "baseui/select";

import { useStyletron } from "baseui";

import {
  IFileFormat,
  FileFormatSelect,
  formats,
} from "../components/FileFormatSelect";
import {
  ISourceFormat,
  SourceFormatSelect,
  sourceFormats,
} from "../components/SourceFormatSelect";

interface IUploadResult {
  success: boolean;
  name: string;
}

interface IProps {
  onUpload(result: IUploadResult): void;
}

const referenceLocationOptions = [
  { id: "document", label: "End of document" },
  { id: "section", label: "End of section" },
  { id: "block", label: "End of block" },
];

const captionPositionOptions = [
  { id: "below", label: "Below" },
  { id: "above", label: "Above" },
];

export const UploadStep: FC<IProps> = ({ onUpload }) => {
  const [css] = useStyletron();
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
  const [referenceLocation, setReferenceLocation] = useState<Value>([referenceLocationOptions[0]]);
  const [figureCaptionPosition, setFigureCaptionPosition] = useState<Value>([captionPositionOptions[0]]);
  const [tableCaptionPosition, setTableCaptionPosition] = useState<Value>([captionPositionOptions[1]]);

  const handleUploadProgress = useCallback((progressEvent) => {
    setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
  }, []);

  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: File[]) => {
      // handle errors
      if (rejectedFiles.length > 0) {
        if (rejectedFiles.length > 1) {
          setErrorMessage("Too many files");
          return;
        }
        setErrorMessage("Something wrong happened");
        return;
      }

      // start uploading a file
      const data = new FormData();
      acceptedFiles.forEach((file, i) => {
        data.append(`files[${i}]`, file);
      });
      data.append("format", destFormat.value);
      data.append("sourceFormat", sourceFormat.value);
      if (templateFile) {
        data.append("template", templateFile);
      }
      // Advanced options
      if (toc) {
        data.append("toc", "true");
        data.append("tocDepth", tocDepth);
      }
      if (numberSections) {
        data.append("numberSections", "true");
      }
      if (embedResources) {
        data.append("embedResources", "true");
      }
      if (referenceLocation[0]) {
        data.append("referenceLocation", (referenceLocation[0] as any).id);
      }
      if (figureCaptionPosition[0]) {
        data.append("figureCaptionPosition", (figureCaptionPosition[0] as any).id);
      }
      if (tableCaptionPosition[0]) {
        data.append("tableCaptionPosition", (tableCaptionPosition[0] as any).id);
      }

      axios
        .post("/api/upload", data, {
          onUploadProgress: handleUploadProgress,
          responseType: "json",
        })
        .then((res) => {
          if (!res || !res.data) {
            setErrorMessage("Unknown error occurred");
            return;
          }
          if (!res.data.success) {
            setErrorMessage(res.data.error || "Something wrong happened");
            return;
          }
          onUpload(res.data);
        });
      setErrorMessage("");
    },
    [onUpload, destFormat, sourceFormat, templateFile, toc, tocDepth, numberSections, embedResources, referenceLocation, figureCaptionPosition, tableCaptionPosition]
  );

  const handleCancel = useCallback(() => {
    setErrorMessage("Upload cancelled");
  }, []);

  const handleRetry = useCallback(() => {
    setProgress(null);
    setErrorMessage("");
  }, []);

  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setTemplateFile(file);
  }, []);

  const handleTemplateClear = useCallback(() => {
    setTemplateFile(null);
    if (templateInputRef.current) {
      templateInputRef.current.value = "";
    }
  }, []);

  const showTemplateOption = destFormat.value === "docx" || destFormat.value === "odt";
  const showAdvancedOptions = sourceFormat.value.includes("markdown") || sourceFormat.value === "gfm";

  return (
    <>
      <FormControl label="Source file format:">
        <SourceFormatSelect onSelect={setSourceFormat} />
      </FormControl>
      <FormControl label="Destination file format:">
        <FileFormatSelect onSelect={setDestFormat} />
      </FormControl>
      {showTemplateOption && (
        <FormControl label="Template (optional):" caption="Reference document for styling">
          <div className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
            <input
              ref={templateInputRef}
              type="file"
              accept=".docx,.odt"
              onChange={handleTemplateChange}
            />
            {templateFile && (
              <Button size="compact" kind="tertiary" onClick={handleTemplateClear}>
                Clear
              </Button>
            )}
          </div>
        </FormControl>
      )}
      {showAdvancedOptions && (
        <>
          <div className={css({ marginBottom: "16px" })}>
            <Checkbox
              checked={toc}
              onChange={(e) => setToc((e.target as HTMLInputElement).checked)}
              labelPlacement={LABEL_PLACEMENT.right}
            >
              Table of Contents
            </Checkbox>
            {toc && (
              <div className={css({ marginLeft: "28px", marginTop: "8px", maxWidth: "100px" })}>
                <FormControl label="TOC Depth:">
                  <Select
                    options={[
                      { id: "1", label: "1" },
                      { id: "2", label: "2" },
                      { id: "3", label: "3" },
                      { id: "4", label: "4" },
                      { id: "5", label: "5" },
                      { id: "6", label: "6" },
                    ]}
                    value={[{ id: tocDepth, label: tocDepth }]}
                    onChange={({ value }) => setTocDepth(value[0] ? (value[0] as any).id : "3")}
                    clearable={false}
                    size="compact"
                  />
                </FormControl>
              </div>
            )}
          </div>
          <div className={css({ marginBottom: "16px" })}>
            <Checkbox
              checked={numberSections}
              onChange={(e) => setNumberSections((e.target as HTMLInputElement).checked)}
              labelPlacement={LABEL_PLACEMENT.right}
            >
              Numbered Sections
            </Checkbox>
          </div>
          <div className={css({ marginBottom: "16px" })}>
            <Checkbox
              checked={embedResources}
              onChange={(e) => setEmbedResources((e.target as HTMLInputElement).checked)}
              labelPlacement={LABEL_PLACEMENT.right}
            >
              Embed Resources
            </Checkbox>
          </div>
          <FormControl label="Reference Links Location:">
            <Select
              options={referenceLocationOptions}
              value={referenceLocation}
              onChange={({ value }) => setReferenceLocation(value)}
              clearable={false}
              size="compact"
            />
          </FormControl>
          <FormControl label="Figure Caption Position:">
            <Select
              options={captionPositionOptions}
              value={figureCaptionPosition}
              onChange={({ value }) => setFigureCaptionPosition(value)}
              clearable={false}
              size="compact"
            />
          </FormControl>
          <FormControl label="Table Caption Position:">
            <Select
              options={captionPositionOptions}
              value={tableCaptionPosition}
              onChange={({ value }) => setTableCaptionPosition(value)}
              clearable={false}
              size="compact"
            />
          </FormControl>
        </>
      )}
      <FileUploader
        multiple={false}
        onCancel={handleCancel}
        onDrop={handleDrop}
        onRetry={handleRetry}
        progressAmount={progress}
        progressMessage={progress ? `Uploading... ${progress}% of 100%` : ""}
        errorMessage={errorMessage}
      />
    </>
  );
};
