# Next.js 15 Upgrade Plan

## Current State
- Next.js 10.0.6
- React 17.0.1
- baseui 9.67.2 (old, uses styletron)
- formidable 1.2.2 (deprecated)
- TypeScript 4.1.4

## Target State
- Next.js 15.x
- React 19.x (or 18.x if baseui incompatible)
- baseui 14.x or replace with alternative
- formidable 3.x or built-in Next.js parsing
- TypeScript 5.x

---

## Phase 1: Core Framework (Est. 1-2 hours)

### 1.1 Update package.json
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0"
}
```

### 1.2 Remove workarounds
- Delete `overrides.postcss` from package.json
- Remove `NODE_OPTIONS=--openssl-legacy-provider` from Dockerfile

### 1.3 Update _document.tsx
Next.js 15 changes:
- `<Html>`, `<Head>`, `<Main>`, `<NextScript>` from `next/document`
- No more `getInitialProps` for _document (use App Router or keep Pages with new pattern)

**Current:**
```tsx
import Document, { Head, Main, NextScript } from "next/document";
class MyDocument extends Document<{ stylesheets: Sheet[] }> {
  static getInitialProps(props: any) { ... }
}
```

**New:**
```tsx
import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="stylesheet" href="/index.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 1.4 Update _app.tsx
- Add types to Component/pageProps
- May need to adjust styletron provider setup

---

## Phase 2: UI Library Decision (Est. 2-3 hours)

### Option A: Upgrade baseui to v14
- baseui 14 supports React 18+
- Styletron still required
- Breaking changes in component APIs
- Migration guide: https://baseweb.design/blog/base-web-v14/

**Components used:**
- `FormControl`
- `FileUploader`
- `Button`
- `Checkbox`
- `Select`
- `FlexGrid`, `FlexGridItem`
- `Spinner` (StyledSpinnerNext)
- `ParagraphMedium`, `HeadingSmall`
- `useStyletron`
- `LightTheme`, `BaseProvider`

### Option B: Replace with Tailwind + headless UI
- Remove styletron complexity entirely
- Simpler _document.tsx (no SSR style injection)
- More work upfront, cleaner long-term
- Components to rebuild: ~8 simple ones

### Option C: Replace with shadcn/ui
- Modern, copy-paste components
- Uses Tailwind + Radix
- Good DX, minimal dependencies

**Recommendation:** Option A (upgrade baseui) for minimal changes, or Option C (shadcn) for best long-term maintainability.

---

## Phase 3: API Routes (Est. 30 min)

### 3.1 formidable upgrade
formidable 1.x → 3.x has breaking changes:

**Current:**
```tsx
const form = new IncomingForm();
(form as any).uploadDir = appConfig.uploadDir;
form.on("fileBegin", ...);
form.parse(req, callback);
```

**New (formidable 3.x):**
```tsx
import formidable from "formidable";
const form = formidable({
  uploadDir: appConfig.uploadDir,
  keepExtensions: true,
});
const [fields, files] = await form.parse(req);
```

### 3.2 Type updates
- `NextApiRequest`/`NextApiResponse` unchanged
- Update `@types/formidable` or use built-in types from formidable 3.x

---

## Phase 4: Page Components (Est. 1 hour)

### 4.1 Router changes
Next.js 13+ introduced App Router, but Pages Router still works.

**Keep Pages Router** - minimal changes:
- `useRouter` from `next/router` still works
- `getServerSideProps` still works
- `NextPage` type still works

### 4.2 Type fixes
- Add explicit types where inferred as `any`
- Fix `useState<string>(null)` → `useState<string | null>(null)`

---

## Phase 5: Dockerfile & Build (Est. 30 min)

### 5.1 Simplify Dockerfile
```dockerfile
FROM pandoc/extra

# Node.js 20 (native support, no hacks)
RUN apk add --no-cache nodejs npm

WORKDIR /work
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

CMD ["npm", "start"]
EXPOSE 3000
```

### 5.2 Remove workarounds
- No `--openssl-legacy-provider`
- No postcss override
- No @types/react pinning

---

## Migration Order

1. **Create branch:** `git checkout -b next15-upgrade`
2. **Phase 1:** Core framework updates
3. **Phase 2:** UI library (test build after)
4. **Phase 3:** API routes (test endpoints)
5. **Phase 4:** Page components (test UI)
6. **Phase 5:** Dockerfile (test container build)
7. **Test full flow:** Upload → Convert → Download
8. **Merge**

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| baseui breaking changes | Medium | Check migration guide, test all components |
| formidable file handling | Low | Well-documented upgrade path |
| Styletron SSR issues | Medium | May need adjustment in _document |
| React 19 compatibility | Low | Can stay on React 18 if needed |

---

## Rollback Plan

If upgrade fails:
1. `git checkout main`
2. Current setup with workarounds continues to work
3. Can attempt incremental upgrades (Next 12 → 13 → 14 → 15)

---

## Time Estimate

| Phase | Optimistic | Realistic | Pessimistic |
|-------|------------|-----------|-------------|
| Phase 1 | 30 min | 1 hour | 2 hours |
| Phase 2 | 1 hour | 2 hours | 4 hours |
| Phase 3 | 15 min | 30 min | 1 hour |
| Phase 4 | 30 min | 1 hour | 2 hours |
| Phase 5 | 15 min | 30 min | 1 hour |
| **Total** | **2.5 hours** | **5 hours** | **10 hours** |

Most variance depends on baseui upgrade complexity.
