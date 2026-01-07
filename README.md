# pandoc-nextjs-extended

A web UI and API for [Pandoc](https://pandoc.org/) document conversion.

Based on [arcatdmz/pandoc-nextjs-server](https://github.com/arcatdmz/pandoc-nextjs-server), extended with a REST API for pipeline integration.

## Features

- **Web UI**: Upload, convert, and download files through a browser interface
- **REST API**: Synchronous conversion endpoint for workflow automation
- **Template Support**: Use reference documents for consistent DOCX/ODT styling
- **Advanced Options**: Table of contents, numbered sections, embedded resources
- **Multiple Formats**: Supports all Pandoc formats (markdown, docx, epub, html, pdf, etc.)

## Quick Start

### Docker (Recommended)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/voltar656/pandoc-nextjs-server:latest

# Run the container
docker run -p 3000:3000 -d --name pandoc ghcr.io/voltar656/pandoc-nextjs-server:latest
```

Or build locally:

```bash
docker build -t pandoc-server .
docker run -p 3000:3000 -d pandoc-server
```

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3000/api/convert
- **Health**: http://localhost:3000/api/health

---

## API Reference

### Health Check

```bash
GET /api/health
```

Response:

```json
{ "status": "ok", "pandoc": "3.8.3" }
```

### Convert Document

```bash
POST /api/convert?from=<format>&to=<format>[&options...]
```

**Query Parameters:**

| Parameter               | Required | Description                                              |
| ----------------------- | -------- | -------------------------------------------------------- |
| `from`                  | Yes      | Source format (e.g., `markdown`, `epub`, `html`, `docx`) |
| `to`                    | Yes      | Target format (e.g., `docx`, `markdown`, `pdf`, `html`)  |
| `toc`                   | No       | Enable table of contents (`true`/`false`)                |
| `tocDepth`              | No       | TOC depth, 1-6 (default: 3)                              |
| `numberSections`        | No       | Number sections (`true`/`false`)                         |
| `embedResources`        | No       | Embed images/resources in output (`true`/`false`)        |
| `referenceLocation`     | No       | Reference links: `document`, `section`, or `block`       |
| `figureCaptionPosition` | No       | Figure captions: `above` or `below`                      |
| `tableCaptionPosition`  | No       | Table captions: `above` or `below`                       |

**Form Fields:**

| Field      | Required | Description                                           |
| ---------- | -------- | ----------------------------------------------------- |
| `file`     | Yes      | The file to convert                                   |
| `template` | No       | Reference document for styling (docx/odt output only) |

**Response:**

- Success: Binary file with appropriate `Content-Type` and `Content-Disposition` headers
- Error: `{"success": false, "error": "..."}`

---

## Examples

### Basic Conversion

```bash
# Markdown to DOCX
curl -X POST -F "file=@document.md" \
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

### With Template

```bash
# Markdown to DOCX with custom styling
curl -X POST \
  -F "file=@document.md" \
  -F "template=@company-template.docx" \
  "http://localhost:3000/api/convert?from=markdown&to=docx" \
  -o styled-output.docx
```

### With Advanced Options

```bash
# Markdown to DOCX with TOC and numbered sections
curl -X POST -F "file=@document.md" \
  "http://localhost:3000/api/convert?from=markdown&to=docx&toc=true&tocDepth=2&numberSections=true" \
  -o output.docx

# HTML with embedded resources
curl -X POST -F "file=@document.md" \
  "http://localhost:3000/api/convert?from=markdown&to=html&embedResources=true" \
  -o standalone.html
```

---

## Supported Formats

See Pandoc documentation for the full list:

```bash
# List input formats
pandoc --list-input-formats

# List output formats
pandoc --list-output-formats
```

**Common formats:** markdown, gfm, html, docx, epub, pdf, rst, latex, odt, rtf, plain

---

## Tech Stack

- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Pandoc 3.8** - Document conversion (via `pandoc/extra` Docker image)
- **TypeScript 5** - Type safety

---

## Development

```bash
# Install dependencies
npm install

# Run dev server (requires pandoc installed locally)
npm run dev

# Build for production
npm run build
npm start
```

> **Note:** Running outside Docker requires pandoc to be installed on your system.

---

## License

MIT - See [LICENSE](LICENSE)

© 2026 Vikesh Malhi (built with Anthropic)
