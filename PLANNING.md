# Pandoc API Extension Plan

## Goal
Add a synchronous API endpoint for use in workflow pipelines (microservice-style), focused on markdown → DOCX conversion.

## Current Architecture
The existing app uses a 3-step async flow:
1. `POST /api/upload` - Upload file + format, returns UUID filename
2. `GET /api/status?file=<name>` - Poll for conversion status
3. `GET /api/download?file=<name>&ext=<ext>` - Download converted file

This is fine for the web UI but awkward for pipeline integration.

## Proposed API

### `POST /api/convert`
Synchronous, single-request conversion endpoint.

**Request:**
- Body: Raw content (`Content-Type: text/markdown`, `text/plain`, or `application/octet-stream`)
- OR: Multipart form with `file` field (`Content-Type: multipart/form-data`)
- Query params:
  - `from` - Source format (required, e.g. `markdown`, `epub`, `html`)
  - `to` - Destination format (required, e.g. `docx`, `markdown`, `pdf`)

**Response:**
- Success: Binary file with appropriate Content-Type and Content-Disposition headers
- Error: JSON `{ "success": false, "error": "..." }`

**Example usage:**
```bash
# Markdown to DOCX (raw body)
curl -X POST -H "Content-Type: text/plain" \
  --data-binary @input.md \
  "http://localhost:8000/api/convert?from=markdown&to=docx" \
  -o output.docx

# EPUB to Markdown (multipart form)
curl -X POST -F "file=@book.epub" \
  "http://localhost:8000/api/convert?from=epub&to=markdown" \
  -o output.md

# HTML to DOCX
curl -X POST -F "file=@page.html" \
  "http://localhost:8000/api/convert?from=html&to=docx" \
  -o output.docx
```

## Web UI Enhancement
Add a dropdown to explicitly select source format (markdown, HTML, etc.) rather than relying on auto-detection. This makes the md→DOCX workflow more explicit.

## Supported Formats
Pass `from` and `to` directly to pandoc - supports all pandoc formats:
- **Input:** markdown, gfm, html, epub, rst, docx, latex, etc.
- **Output:** docx, markdown, pdf, html, rst, rtf, epub, etc.

See `pandoc --list-input-formats` and `pandoc --list-output-formats` for full list.

## Implementation Notes
- Reuse existing `lib/pandoc.ts` for conversion
- Temp files in `uploads/` directory, cleaned up after response
- No meta files needed for sync API (stateless)
- Consider timeout for large conversions
