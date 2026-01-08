import { FC, useCallback } from "react";
import { Select } from "./ui";

export interface IFileFormat {
  value: string;
  label: string;
  ext?: string;
}

export const formats: IFileFormat[] = [
  { value: "docx", label: "Word (.docx)" },
  { value: "pptx", label: "PowerPoint (.pptx)" },
  { value: "odt", label: "OpenDocument (.odt)" },
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "html", label: "HTML (.html)" },
  { value: "markdown", label: "Markdown (.md)", ext: "md" },
  { value: "epub", label: "EPUB (.epub)" },
  { value: "latex", label: "LaTeX (.tex)", ext: "tex" },
  { value: "rst", label: "reStructuredText (.rst)" },
];

interface Props {
  onSelect: (_format: IFileFormat) => void;
}

export const FileFormatSelect: FC<Props> = ({ onSelect }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const format = formats.find((f) => f.value === e.target.value);
      if (format) onSelect(format);
    },
    [onSelect]
  );

  return (
    <Select
      options={formats.map((f) => ({ value: f.value, label: f.label }))}
      onChange={handleChange}
      defaultValue={formats[0]?.value ?? "docx"}
    />
  );
};
