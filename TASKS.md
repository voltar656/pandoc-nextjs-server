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

- [x] Rate limiting (completed in Security section)
- [x] File size limits (completed in Security section)
- [ ] Configurable pandoc options via environment variables
- [ ] Support for pandoc filters
- [ ] Batch conversion endpoint
- [ ] WebSocket progress updates for large files

---

## Code Review Findings (Senior Engineer Assessment)

### Security (Critical) ✅

- [x] **Add automatic file cleanup** - Added `lib/cleanup.ts` with startup + periodic cleanup (every 15 min, files > 1 hour old); integrated via `instrumentation.ts`
- [x] **Use tmpfs for uploads in Docker** - Updated Dockerfile with tmpfs mount instructions and HEALTHCHECK
- [x] **Add file size limits** - Added `maxFileSize` (50MB) and `maxTotalFileSize` (100MB) to formidable config in both `/api/convert` and `/api/upload`
- [x] **Validate format parameters** - Added `isValidSourceFormat()` and `isValidDestFormat()` validation in both API endpoints
- [x] **Add rate limiting** - Added `lib/rateLimit.ts` (30 req/min per IP) to `/api/convert` and `/api/upload`
- [x] **Remove hardcoded localhost in SSR** - Changed `pages/download/[file].tsx` to use direct file system read via `readMetaFile()` instead of HTTP
- [x] **Sanitize all file inputs consistently** - Added `sanitize-filename` to `/api/convert.ts` and `/api/upload.ts`

### Error Handling (High)

- [ ] **Standardize error responses** - Inconsistent patterns: some use `res.json({ success: false })`, others `res.status(4xx).json()`
- [ ] **Add structured logging** - No logging anywhere; add a logger (pino/winston) with request IDs for traceability
- [ ] **Handle cleanup errors** - `unlink()` callbacks silently ignore errors; should at least log
- [ ] **Type error catches** - Many `catch (e)` blocks without proper typing (enabled by `strict: false`)

### Type Safety (High)

- [ ] **Enable TypeScript strict mode** - `tsconfig.json` has `strict: false`, disabling critical safety checks
- [ ] **Eliminate `any` types** - `readMetaFile` returns `Promise<any>`, loses type safety downstream
- [ ] **Add missing @types** - Missing `@types/formidable` and `@types/sanitize-filename` in devDependencies
- [ ] **Tighten IStatus interface** - Too many optional fields make state reasoning difficult; consider discriminated unions

### API Design (Medium)

- [ ] **Refactor API to use JSON options field** - Replace query params with multipart form: `file` (binary) + `options` (JSON object with `from`, `to`, `toc`, etc.); cleaner and more consistent

### Code Quality / DRY (Medium)

- [ ] **Consolidate pandoc execution** - `runPandoc()` in `/api/convert.ts` duplicates `pandoc()` in `lib/pandoc.ts`
- [ ] **Centralize format/MIME mappings** - `mimeTypes` and `extensions` defined in both `/api/convert.ts` and `lib/config.ts`
- [ ] **Standardize async patterns** - Mixed callbacks, Promises, and async/await; prefer async/await throughout
- [ ] **Replace sync file operations** - `copyFileSync` in `scrapbox.ts` blocks the event loop

### Architecture (Medium)

- [x] **Unify conversion flows** - Consolidated to single sync flow; Web UI now calls `/api/convert` directly and triggers browser download; removed async polling, status endpoint, meta files
- [x] **Add orphan file cleanup** - Completed in Security section (startup + periodic cleanup)
- [ ] **Make PDF settings configurable** - PDF engine and geometry settings hardcoded; should be env-configurable
- [ ] **Add concurrency limits** - No cap on parallel pandoc processes; could exhaust system resources
- [ ] **API versioning** - No `/api/v1/` prefix; breaking changes affect all consumers

#### Files Removed (Architecture Simplification)

- `pages/api/upload.ts` - replaced by direct `/api/convert` calls
- `pages/api/status.ts` - no longer needed (sync flow)
- `pages/api/download.ts` - no longer needed (direct blob download)
- `pages/api/scrapbox.ts` - legacy feature removed
- `pages/convert/[file].tsx` - no longer needed (single page flow)
- `pages/download/[file].tsx` - no longer needed (direct download)
- `lib/convert.ts` - async conversion logic removed
- `lib/pandoc.ts` - consolidated into `/api/convert.ts`
- `lib/writeMetaFile.ts` - meta files no longer used
- `lib/readMetaFile.ts` - meta files no longer used
- `lib/scrapbox.ts` - legacy feature removed
- `components/ScrapboxForm.tsx` - legacy feature removed
- `components/UploadStatus.tsx` - no longer needed (sync flow)

### Testing (High)

- [ ] **Add unit tests** - Zero test coverage; add Jest/Vitest for lib functions
- [ ] **Add API integration tests** - Test `/api/convert`, `/api/health` endpoints
- [ ] **Add E2E tests** - Playwright/Cypress for web UI flow
- [ ] **Add test scripts to package.json** - No `test`, `test:unit`, `test:e2e` scripts

### DevOps / Infrastructure (Medium) ✅

- [x] **Add Dockerfile HEALTHCHECK** - Added in Security section
- [x] **Add graceful shutdown** - Added SIGTERM/SIGINT handlers in `instrumentation.ts`
- [x] **Add ESLint + Prettier** - Added ESLint 8 with next/core-web-vitals + prettier config; scripts: `lint`, `lint:fix`, `format`, `format:check`
- [x] **Add pre-commit hooks** - Added husky + lint-staged; runs ESLint and Prettier on staged files

### Documentation (Low)

- [ ] **Add JSDoc comments** - Functions lack documentation; improves IDE experience and maintainability
- [ ] **Add OpenAPI/Swagger spec** - No machine-readable API documentation
- [ ] **Document environment variables** - No `.env.example` or env var documentation

### Performance (Low)

- [ ] **Enable response compression** - No gzip/brotli compression configured
- [ ] **Consider output caching** - Identical conversions could be cached (with hash-based keys)
