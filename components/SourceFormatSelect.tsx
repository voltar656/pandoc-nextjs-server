import { FC, useCallback } from "react";
import { Select } from "./ui";

export interface ISourceFormat {
  value: string;
  label: string;
}

export const sourceFormats: ISourceFormat[] = [
  { value: "markdown", label: "Markdown" },
  { value: "gfm", label: "GitHub Flavored Markdown" },
  { value: "html", label: "HTML" },
  { value: "epub", label: "EPUB" },
  { value: "docx", label: "Word (.docx)" },
  { value: "latex", label: "LaTeX" },
  { value: "rst", label: "reStructuredText" },
];

interface Props {
  onSelect: (_format: ISourceFormat) => void;
}

export const SourceFormatSelect: FC<Props> = ({ onSelect }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const format = sourceFormats.find((f) => f.value === e.target.value);
      if (format) onSelect(format);
    },
    [onSelect]
  );

  return (
    <Select
      options={sourceFormats.map((f) => ({ value: f.value, label: f.label }))}
      onChange={handleChange}
      defaultValue={sourceFormats[0]?.value ?? "markdown"}
    />
  );
};
