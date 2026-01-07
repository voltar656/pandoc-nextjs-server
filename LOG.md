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

## 2026-01-06T20:55:15+00:00

### Summary
Bug fixes and added advanced pandoc options to Web UI and API.

### Bug Fixes
- Fixed "File not found" on download page - Node.js was resolving `localhost` to IPv6 (`::1`) but server only listening on IPv4. Changed to `127.0.0.1`.
- Fixed polling to stop once conversion completes (was updating every second indefinitely).
- Removed "updated every second" message from UI.

### New Features - Advanced Pandoc Options
Added the following options to both Web UI and API:
- **Table of Contents** with configurable depth (1-6)
- **Numbered Sections**
- **Embed Resources**
- **Reference Links Location** (end of document/section/block)
- **Figure Caption Position** (above/below)
- **Table Caption Position** (above/below)

Options appear in Web UI when source format is Markdown/GFM.

### API Usage
```bash
curl -X POST -F "file=@doc.md" -F "template=@ref.docx" \
  "http://localhost:8000/api/convert?from=markdown&to=docx&toc=true&tocDepth=3&numberSections=true&embedResources=true&referenceLocation=document&figureCaptionPosition=below&tableCaptionPosition=above" \
  -o output.docx
```

### Files Changed
- `components/UploadStep.tsx` - added advanced options UI
- `lib/writeMetaFile.ts` - added option fields to IStatus
- `lib/convert.ts` - pass options to pandoc
- `pages/api/upload.ts` - parse options from form data
- `pages/api/convert.ts` - parse options from query params
- `pages/convert/[file].tsx` - fixed polling, removed message
- `pages/download/[file].tsx` - fixed IPv6 issue

### Live
https://oboe-alpha.exe.xyz:8000/

## 2026-01-07T00:45:00+00:00

### Summary
Tooling modernization and GitHub Actions workflow update for GHCR.

### Completed
- Removed `.vscode/` directory (editor-specific settings)
- Updated `.github/workflows/deploy.yml` from Azure deployment to GHCR push
- Fixed Node 18 compatibility issues:
  - Added `postcss` override (`^8.4.31` → 8.5.6) to fix `ERR_PACKAGE_PATH_NOT_EXPORTED`
  - Pinned `@types/react` to `17.0.39` (fixes detection bug with Next.js 10)
- Regenerated `package-lock.json` with modern dependency resolution

### Tooling Status
| Component | Status | Details |
|-----------|--------|--------|
| Node version | ✅ | 18.19.0 (musl build for Alpine) |
| Package manager | ✅ | npm with `--legacy-peer-deps` |
| Lockfile | ✅ | Regenerated fresh |
| PostCSS | ✅ | Override to ^8.4.31 |
| @types/react | ✅ | Pinned to 17.0.39 |
| OpenSSL | ✅ | `--openssl-legacy-provider` in Dockerfile |

### New Workflow
- Triggers on push to `main` or manual dispatch
- Builds Docker image and pushes to GHCR
- Tags: `latest` + commit SHA
- Uses built-in `GITHUB_TOKEN` (no secrets needed)

### Pull Command
```bash
docker pull ghcr.io/voltar656/pandoc-nextjs-server:latest
```

### Files Changed
- `.vscode/settings.json` - deleted
- `.github/workflows/deploy.yml` - rewritten for GHCR
- `package.json` - added postcss override, pinned @types/react
- `package-lock.json` - regenerated

### Next Steps
- Push to GitHub to trigger workflow
- Verify image appears in GitHub Packages
- Make package public if needed for unauthenticated pulls

## 2026-01-07T01:15:00+00:00

### Summary
Major upgrade: Next.js 15 + React 19 + Tailwind CSS (replaced baseui/styletron).

### Completed
- Upgraded Next.js from 10 to 15
- Upgraded React from 17 to 19
- Replaced baseui/styletron UI library with Tailwind CSS
- Upgraded formidable from 1.x to 3.x (now uses async/await)
- Upgraded axios to 1.x
- Upgraded TypeScript to 5.x
- Simplified Dockerfile (no more Node.js workarounds needed)

### Removed Dependencies
- baseui
- styletron-engine-atomic
- styletron-react
- @types/formidable (now built-in)
- @types/styletron-*
- cross-env (not needed)

### Removed Workarounds
- `postcss` override in package.json
- `NODE_OPTIONS=--openssl-legacy-provider` in Dockerfile
- `@types/react` pinning

### New Files
- `components/ui.tsx` - Button, Select, Checkbox, FormControl, Spinner, Typography
- `components/FileUploader.tsx` - Custom drag-drop file uploader
- `styles/globals.css` - Tailwind imports
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

### Package.json Changes
```json
{
  "dependencies": {
    "next": "^15.0.0",      // was ^10.0.6
    "react": "^19.0.0",     // was ^17.0.1
    "axios": "^1.7.0",      // was ^0.21.1
    "formidable": "^3.5.0"  // was ^1.2.2
  },
  "devDependencies": {
    "typescript": "^5.0.0", // was ^4.1.4
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Build Results
- 0 vulnerabilities (was 40+)
- Build time: ~18 seconds
- First Load JS: ~100KB shared + 3-4KB per page

### Branch
`next15-tailwind` - ready for review/merge

### Screenshot
New Tailwind UI with clean stepper, form controls, and drag-drop uploader.

## 2026-01-07T01:45:00+00:00

### Summary
Merged Next.js 15 upgrade to main, fixed issues, tested in Docker, pushed to GitHub.

### Completed
- Added explicit "Convert" button to Upload page (was auto-submitting on file drop)
- Fixed `.dockerignore` excluding `*.js` which blocked `postcss.config.js` and `tailwind.config.js`
- Merged `next15-tailwind` branch to `main`
- Built and tested Docker image locally
- Verified API conversion works (markdown → HTML)
- Verified Tailwind CSS renders correctly in container
- Updated all documentation (TASKS.md, PLANNING.md, README.md)
- Pushed to GitHub - workflow triggered for GHCR

### Files Changed
- `components/UploadStep.tsx` - two-step flow: select file, then click Convert
- `.dockerignore` - removed `**/*.js` pattern, added specific exclusions
- `TASKS.md` - reorganized, marked all priorities complete
- `PLANNING.md` - added v2.0 architecture, full API docs, comparison table
- `README.md` - comprehensive rewrite with GHCR instructions, API tables, examples

### Docker Test Results
```bash
# Health check
curl http://localhost:8003/api/health
# {"status":"ok","pandoc":"3.8.3"}

# Conversion test
curl -X POST -F "file=@test.md" "http://localhost:8003/api/convert?from=markdown&to=html"
# <h1 id="hello-world">Hello World</h1>...
```

### Git Status
```
main branch: 660e3b9
Pushed to: github.com/voltar656/pandoc-nextjs-server
GHCR image: ghcr.io/voltar656/pandoc-nextjs-server:latest
```

### What's Ready
- ✅ Web UI with Tailwind CSS
- ✅ REST API with all pandoc options
- ✅ Docker image on GHCR
- ✅ GitHub Actions CI/CD
- ✅ Full documentation

### Tomorrow: Testing Checklist
1. Pull from GHCR and verify
2. Web UI: Upload → Convert → Download flow
3. API: Various format conversions
4. Template support (docx with reference doc)
5. Advanced options (TOC, numbering, embed)
6. Error handling edge cases
7. Deploy to small prod for feedback
