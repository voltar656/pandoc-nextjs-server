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
