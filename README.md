# pandoc-nextjs-extended

A web UI and API for [Pandoc](https://pandoc.org/) document conversion.

Based on [arcatdmz/pandoc-nextjs-server](https://github.com/arcatdmz/pandoc-nextjs-server), extended with a REST API for pipeline integration.

## Features

- **Web UI**: Upload, convert, and download files through a browser interface
- **REST API**: Synchronous conversion endpoint for workflow automation
- **Template Support**: Use reference documents for consistent DOCX/ODT styling
- **Multiple Formats**: Supports all Pandoc formats (markdown, docx, epub, html, pdf, etc.)

## Quick Start

```sh
# Build the image
docker build -t pandoc-nextjs-extended .

# Run the container
docker run -p 3000:3000 -d --name pandoc pandoc-nextjs-extended
```

- Web UI: http://localhost:3000
- API: http://localhost:3000/api/convert

## API Reference

### Health Check

```sh
GET /api/health
```

Response:
```json
{"status": "ok", "pandoc": "3.8.3"}
```

### Convert Document

```sh
POST /api/convert?from=<format>&to=<format>
```

**Query Parameters:**
- `from` (required): Source format (e.g., `markdown`, `epub`, `html`, `docx`)
- `to` (required): Target format (e.g., `docx`, `markdown`, `pdf`, `html`)

**Form Fields:**
- `file` (required): The file to convert
- `template` (optional): Reference document for styling (docx/odt output)

**Response:**
- Success: Binary file with appropriate Content-Type
- Error: `{"success": false, "error": "..."}`

### Examples

```sh
# Markdown to DOCX
curl -X POST -F "file=@document.md" \
  "http://localhost:3000/api/convert?from=markdown&to=docx" \
  -o output.docx

# Markdown to DOCX with custom template
curl -X POST -F "file=@document.md" -F "template=@reference.docx" \
  "http://localhost:3000/api/convert?from=markdown&to=docx" \
  -o output.docx

# EPUB to Markdown
curl -X POST -F "file=@book.epub" \
  "http://localhost:3000/api/convert?from=epub&to=markdown" \
  -o output.md

# HTML to PDF
curl -X POST -F "file=@page.html" \
  "http://localhost:3000/api/convert?from=html&to=pdf" \
  -o output.pdf
```

## Supported Formats

See Pandoc documentation for full list:
- Input: `pandoc --list-input-formats`
- Output: `pandoc --list-output-formats`

Common formats: markdown, gfm, html, docx, epub, pdf, rst, latex, odt, rtf

## License

MIT

---

Original project (c) Jun Kato 2020-2021
