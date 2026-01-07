# Tasks

## Completed ✅

### Priority 1: API Endpoint ✅
- [x] Create `pages/api/convert.ts` - synchronous conversion endpoint
- [x] Create `pages/api/health.ts` - health check with pandoc version
- [x] Support query params: `from`, `to`, `toc`, `tocDepth`, `numberSections`, etc.
- [x] Support multipart form: `file` (required), `template` (optional)
- [x] Support `--reference-doc` for docx/odt templates
- [x] Return appropriate Content-Type and Content-Disposition headers

### Priority 2: Container Setup ✅
- [x] Dockerfile using `pandoc/extra` base image
- [x] Node.js 20+ (native Alpine package)
- [x] Single port 3000 (Next.js serves both UI and API)
- [x] No supervisord needed - Next.js handles everything

### Priority 3: Web UI Updates ✅
- [x] Add source format dropdown
- [x] Add destination format dropdown
- [x] Add template upload option (for docx/odt)
- [x] Add advanced options (TOC, numbered sections, embed resources, etc.)
- [x] Add explicit Convert button (two-step: select file, then convert)

### Priority 4: Documentation ✅
- [x] Update README.md with API usage examples
- [x] Update PLANNING.md with architecture notes

### Priority 5: Modernization ✅ (2026-01-07)
- [x] Upgrade Next.js 10 → 15
- [x] Upgrade React 17 → 19
- [x] Replace baseui/styletron with Tailwind CSS
- [x] Upgrade formidable 1.x → 3.x (async API)
- [x] Upgrade TypeScript 4.x → 5.x
- [x] Remove all workarounds (postcss override, openssl-legacy-provider)
- [x] GitHub Actions workflow for GHCR

## Future / Nice to Have

- [ ] Rate limiting
- [ ] File size limits
- [ ] Configurable pandoc options via environment variables
- [ ] Support for pandoc filters
- [ ] Batch conversion endpoint
- [ ] WebSocket progress updates for large files
