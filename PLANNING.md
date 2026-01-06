# Pandoc API Extension Plan

## Goal
Add a synchronous API endpoint for use in workflow pipelines (microservice-style).

## Proposed API

### `POST /api/convert`
Synchronous, single-request conversion endpoint.

**Request:**
- Body: Multipart form with `file` field
- Query params:
  - `from` - Source format (required, e.g. `markdown`, `epub`, `html`)
  - `to` - Destination format (required, e.g. `docx`, `markdown`, `pdf`)
- Optional form fields:
  - `template` - Reference doc file (e.g., .docx template for styling)

**Response:**
- Success: Binary file with appropriate Content-Type and Content-Disposition headers
- Error: JSON `{ "success": false, "error": "..." }`

**Example usage:**
```bash
# Markdown to DOCX
curl -X POST -F "file=@input.md" \
  "http://localhost:3001/api/convert?from=markdown&to=docx" \
  -o output.docx

# Markdown to DOCX with template
curl -X POST -F "file=@input.md" -F "template=@reference.docx" \
  "http://localhost:3001/api/convert?from=markdown&to=docx" \
  -o output.docx

# EPUB to Markdown
curl -X POST -F "file=@book.epub" \
  "http://localhost:3001/api/convert?from=epub&to=markdown" \
  -o output.md
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{ "status": "ok", "pandoc": "3.x.x" }
```

## Architecture
Single container running both:
- **Port 3000:** Next.js web UI (existing)
- **Port 3001:** Next.js API server (or separate Express server)

Use supervisord to manage processes.

## Implementation Notes
- Custom endpoint shells out to pandoc
- Temp files in `uploads/` directory, cleaned up after response
- Template files uploaded per-request, also cleaned up
- Full pandoc feature support (PDF, filters, templates)
