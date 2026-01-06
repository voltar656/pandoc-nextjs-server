# Development Log

## 2026-01-06T15:23:41+00:00

### Summary
Initial setup for extending pandoc-nextjs-server with a pipeline-friendly API.

### Completed
- Cloned repo from `arcatdmz/pandoc-nextjs-server`
- Ran original Docker image (`arcatdmz/pandoc-nextjs-server`) on port 8000 - verified working
- Updated `Dockerfile` to use official `pandoc/extra` base image
- Created `PLANNING.md` with API design for `POST /api/convert` endpoint
- Created `TASKS.md` with implementation checklist

### Key Decisions
- API endpoint: `POST /api/convert?from=<format>&to=<format>`
- Both `from` and `to` params required, passed directly to pandoc
- Supports any pandoc format (markdown, epub, docx, html, pdf, etc.)
- Synchronous, stateless design for pipeline use

### Files Changed
- `Dockerfile` - switched base image from `k1low/alpine-pandoc-ja` to `pandoc/extra`
- `PLANNING.md` - new file, API design doc
- `TASKS.md` - new file, implementation tasks

### Next Steps
- Implement `pages/api/convert.ts`
- Build and test Docker image with new base
- Test API with curl

## 2026-01-06T15:47:39+00:00

### Summary
Evaluated pandoc-server vs custom endpoint for API implementation.

### Investigation
- Tested `pandoc-server` built-in API (runs via `pandoc-server --port 3000`)
- Confirmed it works for basic conversions (markdown→docx, epub→markdown)
- Discovered `pandoc-server` blocks filesystem access for security
- **Blocker:** `reference-doc` templates not supported in pandoc-server ("File not found in resource path" error regardless of file location)

### Decision
- Rejected pandoc-server due to template requirement
- Chose custom `/api/convert` endpoint that shells out to pandoc
- Full feature support: templates, PDF, filters
- Trade-off: must manage temp file security separately

### Plan Updates
- `PLANNING.md`: Revised to custom endpoint with template support
- `TASKS.md`: Reprioritized - API endpoint first, then container setup with supervisord

### Architecture
- Single container, single port (3000)
- Next.js serves both web UI and API (`pages/api/convert.ts`)
- Supervisord manages Next.js process
- Health endpoint at `/api/health`

### Next Steps
- Implement `pages/api/convert.ts` with template support
- Implement `pages/api/health.ts`
- Test with curl

## 2026-01-06T15:59:54+00:00

### Summary
Implemented Priority 1: API endpoints for conversion and health check.

### Completed
- Created `pages/api/convert.ts` - synchronous conversion endpoint
  - Accepts `from` and `to` query params (required)
  - Accepts `file` (required) and `template` (optional) form fields
  - Supports `--reference-doc` for docx/odt templates
  - Streams result with appropriate Content-Type/Disposition headers
  - Cleans up temp files after response
- Created `pages/api/health.ts` - returns status and pandoc version
- Fixed type errors in existing code (`_document.tsx`, `upload.ts`) for formidable v1 compatibility
- Updated Dockerfile for `pandoc/extra` base with Node.js 18
- Added `NODE_OPTIONS=--openssl-legacy-provider` for old webpack compatibility

### API Examples
```bash
# Health check
curl http://localhost:8000/api/health
# {"status":"ok","pandoc":"3.8.3"}

# Markdown to DOCX
curl -X POST -F "file=@input.md" \
  "http://localhost:8000/api/convert?from=markdown&to=docx" -o output.docx

# With template
curl -X POST -F "file=@input.md" -F "template=@reference.docx" \
  "http://localhost:8000/api/convert?from=markdown&to=docx" -o output.docx

# EPUB to Markdown  
curl -X POST -F "file=@book.epub" \
  "http://localhost:8000/api/convert?from=epub&to=markdown" -o output.md
```

### Files Changed
- `pages/api/convert.ts` - new file
- `pages/api/health.ts` - new file
- `pages/api/upload.ts` - type fixes
- `pages/_document.tsx` - type fixes
- `Dockerfile` - updated for pandoc/extra + Node 18
- `TASKS.md` - marked Priority 1 complete

### Next Steps
- Priority 2: Container setup with supervisord
- Priority 3: Web UI updates (source format dropdown, template upload)

## 2026-01-06T18:35:34+00:00

### Summary
Completed Priority 3: Web UI enhancements and Priority 4: Documentation.

### Completed
- Added source format dropdown to Web UI
  - Options: Markdown, GFM, HTML, EPUB, DOCX, LaTeX, RST
- Added template file picker (conditional, shows for DOCX/ODT output)
- Updated upload API to handle `sourceFormat` and `template` fields
- Updated convert flow to pass source format and template to pandoc
- Renamed project to `pandoc-nextjs-extended`
- Removed "Fork me on GitHub" banner
- Updated README with full API documentation
- Updated LICENSE with copyright attribution

### Files Changed
- `lib/config.ts` - added sourceFormats array
- `lib/convert.ts` - pass source format and template to pandoc
- `lib/writeMetaFile.ts` - added sourceFormat and templatePath to IStatus
- `pages/api/upload.ts` - handle template file and source format
- `components/UploadStep.tsx` - added source format and template UI
- `components/SourceFormatSelect.tsx` - new component
- `components/Layout.tsx` - renamed, removed GitHub ribbon
- `components/Header.tsx` - renamed
- `package.json` - renamed
- `README.md` - full API documentation
- `LICENSE` - added copyright

### Status
- Priority 1: API Endpoint ✅
- Priority 2: Container Setup (supervisord) - skipped, works without
- Priority 3: Web UI Updates ✅
- Priority 4: Documentation ✅

### Live
https://oboe-alpha.exe.xyz:8000/
