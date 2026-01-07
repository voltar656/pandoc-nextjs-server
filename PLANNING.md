# Pandoc API Extension Plan

## Goal

Add a synchronous API endpoint for use in workflow pipelines (microservice-style).

## Current Architecture (v2.0 - Updated 2026-01-07)

### Stack

- **Next.js 15** with Pages Router
- **React 19**
- **Tailwind CSS** for styling
- **TypeScript 5**
- **formidable 3.x** for file uploads
- **Docker** with `pandoc/extra` base image

### Single Container Design

- **Port 3000:** Next.js serves both web UI and API
- No supervisord needed - Next.js handles everything
- Stateless design - temp files cleaned up after each request

---

## API Endpoints

### `POST /api/convert`

Synchronous, single-request conversion endpoint.

**Request:**

- Body: Multipart form with `file` field
- Query params:
  - `from` - Source format (required, e.g. `markdown`, `epub`, `html`)
  - `to` - Destination format (required, e.g. `docx`, `markdown`, `pdf`)
  - `toc` - Enable table of contents (`true`/`false`)
  - `tocDepth` - TOC depth (1-6)
  - `numberSections` - Number sections (`true`/`false`)
  - `embedResources` - Embed resources in output (`true`/`false`)
  - `referenceLocation` - Reference links location (`document`/`section`/`block`)
  - `figureCaptionPosition` - Figure caption position (`above`/`below`)
  - `tableCaptionPosition` - Table caption position (`above`/`below`)
- Optional form fields:
  - `template` - Reference doc file (e.g., .docx template for styling)

**Response:**

- Success: Binary file with appropriate Content-Type and Content-Disposition headers
- Error: JSON `{ "success": false, "error": "..." }`

**Example usage:**

```bash
# Markdown to DOCX
curl -X POST -F "file=@input.md" \
  "http://localhost:3000/api/convert?from=markdown&to=docx" \
  -o output.docx

# Markdown to DOCX with template and TOC
curl -X POST -F "file=@input.md" -F "template=@reference.docx" \
  "http://localhost:3000/api/convert?from=markdown&to=docx&toc=true&tocDepth=3" \
  -o output.docx

# EPUB to Markdown
curl -X POST -F "file=@book.epub" \
  "http://localhost:3000/api/convert?from=epub&to=markdown" \
  -o output.md

# Markdown to PDF
curl -X POST -F "file=@input.md" \
  "http://localhost:3000/api/convert?from=markdown&to=pdf" \
  -o output.pdf
```

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{ "status": "ok", "pandoc": "3.8.3" }
```

---

## Web UI Flow

1. **Upload Page** (`/`)
   - Select source format
   - Select destination format
   - Optional: Upload template file (for docx/odt)
   - Optional: Configure advanced options (TOC, numbering, etc.)
   - Drop or browse for file
   - Click "Convert" button

2. **Convert Page** (`/convert/[file]`)
   - Shows conversion status
   - Polls `/api/status` until complete
   - Shows error if conversion fails

3. **Download Page** (`/download/[file]`)
   - Download button for converted file

---

## Docker Deployment

```bash
# Build
docker build -t pandoc-server .

# Run
docker run -p 3000:3000 pandoc-server

# Pull from GHCR (after CI push)
docker pull ghcr.io/OWNER/pandoc-nextjs-server:latest
```

---

## Implementation Notes

- Custom endpoint shells out to pandoc via `spawn()`
- Temp files stored in `uploads/` directory, cleaned up after response
- Template files uploaded per-request, also cleaned up
- Full pandoc feature support: PDF (via xelatex), filters, templates

---

## Original vs Current

| Aspect          | Original (v1)      | Current (v2)   |
| --------------- | ------------------ | -------------- |
| Next.js         | 10                 | 15             |
| React           | 17                 | 19             |
| UI Library      | baseui + styletron | Tailwind CSS   |
| File Upload     | formidable 1.x     | formidable 3.x |
| TypeScript      | 4.x                | 5.x            |
| Node.js         | 18 (with hacks)    | 20+ (native)   |
| Vulnerabilities | 40+                | 0              |
