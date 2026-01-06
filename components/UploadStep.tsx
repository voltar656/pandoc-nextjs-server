import { useState, useCallback, FC, useRef } from "react";
import axios from "axios";
import { FormControl } from "baseui/form-control";
import { FileUploader } from "baseui/file-uploader";
import { Button } from "baseui/button";
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

export const UploadStep: FC<IProps> = ({ onUpload }) => {
  const [css] = useStyletron();
  const [errorMessage, setErrorMessage] = useState("");
  const [sourceFormat, setSourceFormat] = useState<ISourceFormat>(sourceFormats[0]);
  const [destFormat, setDestFormat] = useState<IFileFormat>(formats[0]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

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
    [onUpload, destFormat, sourceFormat, templateFile]
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
