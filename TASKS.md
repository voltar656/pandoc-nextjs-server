# Tasks

## Priority 1: API Endpoint ✅

- [x] Create `pages/api/convert.ts`
  - [x] Parse query params (`from`, `to`) - both required
  - [x] Handle multipart form: `file` (required), `template` (optional)
  - [x] Write temp files, run pandoc with appropriate args, stream result, cleanup
  - [x] Support `--reference-doc` for docx/odt templates
  - [x] Return appropriate Content-Type and Content-Disposition headers
  - [x] Return JSON error on failure

- [x] Create `pages/api/health.ts`
  - [x] Return status and pandoc version

- [x] Test with curl:
  - [x] markdown → docx
  - [x] markdown → docx with template
  - [x] epub → markdown

## Priority 2: Container Setup

- [ ] Install supervisord in Dockerfile
- [ ] Create supervisord.conf to manage Next.js on port 3000
- [ ] Expose port 3000 (API is part of Next.js)
- [ ] Build and test image

## Priority 3: Web UI Updates ✅

- [x] Add source format dropdown
- [x] Add template upload option
- [x] Keep PDF option (supported)

## Priority 4: Documentation

- [ ] Update README.md with API usage examples

## Future

- [ ] Rate limiting
- [ ] File size limits
- [ ] Consolidate logging
