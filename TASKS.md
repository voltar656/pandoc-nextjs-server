# Tasks

## API Endpoint

- [ ] Create `pages/api/convert.ts` - synchronous conversion endpoint
  - [ ] Parse query params (`from`, `to`) - both required
  - [ ] Validate formats against pandoc's supported formats
  - [ ] Handle raw body input (`text/plain`, `application/octet-stream`)
  - [ ] Handle multipart form input (`file` field)
  - [ ] Write temp file, run pandoc, stream result, cleanup
  - [ ] Return appropriate Content-Type and Content-Disposition headers
  - [ ] Return JSON error on failure

- [ ] Add tests / manual verification with curl

## Web UI Enhancement

- [ ] Add source format dropdown to `components/UploadStep.tsx`
  - [ ] Create `SourceFormatSelect` component (or extend `FileFormatSelect`)
  - [ ] Pass source format to upload API

- [ ] Update `pages/api/upload.ts` to accept optional `fromFormat` field

- [ ] Update `lib/convert.ts` to use specified source format in pandoc call

## Documentation

- [ ] Update README.md with API usage examples

## Optional / Future

- [ ] Add rate limiting to API endpoint
- [ ] Add file size limits
- [ ] Support reference doc templates for DOCX styling
- [ ] Async mode with webhook callback for large files
