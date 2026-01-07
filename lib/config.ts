import { IScrapboxOptions } from "./scrapbox";

export interface IFormat {
  label: string;
  value: string;
  ext?: string;
  mime?: string;
}

const config = {
  uploadDir: "uploads",
  sourceFormats: [
    { label: "Markdown (.md)", value: "markdown" },
    { label: "GitHub-Flavored Markdown (.md)", value: "gfm" },
    { label: "HTML (.html)", value: "html" },
    { label: "EPUB (.epub)", value: "epub" },
    { label: "Microsoft Word (.docx)", value: "docx" },
    { label: "LaTeX (.tex)", value: "latex" },
    { label: "reStructuredText (.rst)", value: "rst" },
  ],
  formats: [
    { label: "Adobe PDF (.pdf)", value: "pdf", mime: "application/pdf" },
    { label: "HTML (.html)", value: "html", mime: "text/html" },
    { label: "GitHub-Flavored Markdown (.md)", value: "gfm", ext: "md", mime: "text/plain" },
    { label: "Pandoc's Markdown (.md)", value: "markdown", ext: "md", mime: "text/plain" },
    { label: "reStructuredText (.rst)", value: "rst", mime: "text/plain" },
    { label: "Rich Text Format (.rtf)", value: "rtf", mime: "application/rtf" },
    { label: "Microsoft Word (.docx)", value: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ] as IFormat[],
  scrapbox: {
    options: {
      filter: /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$/,
      openings: [],
      endings: [],
      skipBlankPages: true,
    } as IScrapboxOptions,
  },
};

export default config;
