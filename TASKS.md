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

### Error Handling (High) ✅

- [x] **Standardize error responses** - Created `lib/errors.ts` with `AppError` class, `ErrorCode` enum, and `sendError()` helper; all endpoints now use consistent `{ success: false, error: string, code?: string }` format
- [x] **Add structured logging** - Added pino logger (`lib/logger.ts`) with request ID tracking, log levels, and pretty printing in dev
- [x] **Handle cleanup errors** - `cleanupFiles()` now logs warnings for failed deletions instead of silently ignoring
- [x] **Type error catches** - All catch blocks now properly typed with `catch (err: unknown)` and `getErrorMessage()` helper

### Type Safety (High) ✅

- [x] **Enable TypeScript strict mode** - Enabled `strict: true` and `noUncheckedIndexedAccess: true` in tsconfig.json
- [x] **Eliminate `any` types** - Removed readMetaFile (no longer used); all remaining code is strictly typed
- [x] **Add missing @types** - Added `@types/formidable` (sanitize-filename has built-in types)
- [x] **Tighten interfaces** - Simplified codebase by removing async flow; remaining interfaces are minimal and well-typed

### API Design (Medium) ✅

- [x] **API design complete** - Query params for options (`from`, `to`, `toc`, etc.) with multipart form for files; RESTful, well-documented, and working correctly

### Code Quality / DRY (Medium) ✅

- [x] **Consolidate pandoc execution** - `lib/pandoc.ts` removed; single `runPandoc()` in `/api/convert.ts`
- [x] **Centralize format/MIME mappings** - Format config centralized in `lib/config.ts`; `/api/convert.ts` uses helpers
- [x] **Standardize async patterns** - All code now uses async/await; callbacks only for stream events
- [x] **Replace sync file operations** - `scrapbox.ts` removed; no sync file operations remain

### Architecture (Medium)

- [x] **Unify conversion flows** - Consolidated to single sync flow; Web UI now calls `/api/convert` directly and triggers browser download; removed async polling, status endpoint, meta files
- [x] **Add orphan file cleanup** - Completed in Security section (startup + periodic cleanup)

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

### Testing (High) ✅

- [x] **Add unit tests** - Added Vitest tests for `lib/config.ts`, `lib/errors.ts`, `lib/rateLimit.ts` (36 tests)
- [x] **Add API integration tests** - Tests for `/api/convert` and `/api/health` endpoints (13 tests, 5 skipped without pandoc)
- [x] **Add E2E tests** - Playwright tests for web UI flow (13 tests, 2 skipped without pandoc)
- [x] **Add test scripts to package.json** - Added `test`, `test:watch`, `test:unit`, `test:integration`, `test:e2e`, `test:all`

### DevOps / Infrastructure (Medium) ✅

- [x] **Add Dockerfile HEALTHCHECK** - Added in Security section
- [x] **Add graceful shutdown** - Added SIGTERM/SIGINT handlers in `instrumentation.ts`
- [x] **Add ESLint + Prettier** - Added ESLint 8 with next/core-web-vitals + prettier config; scripts: `lint`, `lint:fix`, `format`, `format:check`
- [x] **Add pre-commit hooks** - Added husky + lint-staged; runs ESLint and Prettier on staged files

### Documentation (Low)

- [x] **Add JSDoc comments** - Added module-level and function-level JSDoc to all lib files and API handlers
- [ ] **Add OpenAPI/Swagger spec** - No machine-readable API documentation
- [x] **Document environment variables** - Added `.env.example` with LOG_LEVEL and NODE_ENV

### Performance

_No tasks - compression not beneficial for already-compressed document formats; caching rejected for security (avoid retaining user documents)._
