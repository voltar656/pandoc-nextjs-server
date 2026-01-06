# Tasks

## Priority 1: API Endpoint

- [ ] Create `pages/api/convert.ts`
  - [ ] Parse query params (`from`, `to`) - both required
  - [ ] Handle multipart form: `file` (required), `template` (optional)
  - [ ] Write temp files, run pandoc with appropriate args, stream result, cleanup
  - [ ] Support `--reference-doc` for docx/odt templates
  - [ ] Return appropriate Content-Type and Content-Disposition headers
  - [ ] Return JSON error on failure

- [ ] Create `pages/api/health.ts`
  - [ ] Return status and pandoc version

- [ ] Test with curl:
  - [ ] markdown → docx
  - [ ] markdown → docx with template
  - [ ] epub → markdown

## Priority 2: Container Setup

- [ ] Install supervisord in Dockerfile
- [ ] Create supervisord.conf to manage Next.js on port 3000
- [ ] Expose port 3000 (API is part of Next.js)
- [ ] Build and test image

## Priority 3: Web UI Updates

- [ ] Add source format dropdown
- [ ] Add template upload option
- [ ] Remove or keep PDF option (now supported)

## Priority 4: Documentation

- [ ] Update README.md with API usage examples

## Future

- [ ] Rate limiting
- [ ] File size limits
- [ ] Consolidate logging
