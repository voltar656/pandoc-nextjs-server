import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server } from "http";
import { parse } from "url";
import next from "next";
import { execSync } from "child_process";
import FormData from "form-data";
import axios from "axios";

// Check if pandoc is available
let pandocAvailable = false;
try {
  execSync("pandoc --version", { stdio: "ignore" });
  pandocAvailable = true;
} catch {
  pandocAvailable = false;
}

describe("/api/convert", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = next({ dev: false, dir: process.cwd() });
    const handle = app.getRequestHandler();
    await app.prepare();

    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it.skipIf(!pandocAvailable)("converts markdown to html", async () => {
    const form = new FormData();
    const mdContent = "# Hello\n\nThis is **bold** text.";
    form.append("file", Buffer.from(mdContent), {
      filename: "test.md",
      contentType: "text/markdown",
    });

    const response = await axios.post(`${baseUrl}/api/convert?from=markdown&to=html`, form, {
      headers: form.getHeaders(),
      responseType: "text",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.data).toContain("<h1");
    expect(response.data).toContain("Hello");
    expect(response.data).toContain("<strong>");
  });

  it.skipIf(!pandocAvailable)("converts markdown to docx", async () => {
    const form = new FormData();
    const mdContent = "# Test Document\n\nSome content.";
    form.append("file", Buffer.from(mdContent), {
      filename: "test.md",
      contentType: "text/markdown",
    });

    const response = await axios.post(`${baseUrl}/api/convert?from=markdown&to=docx`, form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(response.headers["content-disposition"]).toContain("attachment");
    // DOCX files start with PK (zip signature)
    const data = Buffer.from(response.data);
    expect(data.slice(0, 2).toString()).toBe("PK");
  });

  it("returns 400 for missing from parameter", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("test"), { filename: "test.md" });

    try {
      await axios.post(`${baseUrl}/api/convert?to=html`, form, {
        headers: form.getHeaders(),
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(400);
      const data = err.response.data;
      expect(data.success).toBe(false);
      expect(data.error).toContain("from");
    }
  });

  it("returns 400 for missing to parameter", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("test"), { filename: "test.md" });

    try {
      await axios.post(`${baseUrl}/api/convert?from=markdown`, form, {
        headers: form.getHeaders(),
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(400);
      const data = err.response.data;
      expect(data.success).toBe(false);
      expect(data.error).toContain("to");
    }
  });

  it("returns 400 for invalid source format", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("test"), { filename: "test.md" });

    try {
      await axios.post(`${baseUrl}/api/convert?from=invalidformat&to=html`, form, {
        headers: form.getHeaders(),
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.code).toBe("INVALID_FORMAT");
    }
  });

  it("returns 400 for invalid destination format", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("test"), { filename: "test.md" });

    try {
      await axios.post(`${baseUrl}/api/convert?from=markdown&to=invalidformat`, form, {
        headers: form.getHeaders(),
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.code).toBe("INVALID_FORMAT");
    }
  });

  it("returns 400 for missing file", async () => {
    const form = new FormData();
    // No file appended

    try {
      await axios.post(`${baseUrl}/api/convert?from=markdown&to=html`, form, {
        headers: form.getHeaders(),
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.code).toBe("MISSING_FIELD");
    }
  });

  it("returns 405 for GET requests", async () => {
    try {
      await axios.get(`${baseUrl}/api/convert?from=markdown&to=html`);
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.response.status).toBe(405);
      expect(err.response.data.code).toBe("METHOD_NOT_ALLOWED");
    }
  });

  it.skipIf(!pandocAvailable)("supports TOC option", async () => {
    const form = new FormData();
    const mdContent = "# Heading 1\n\nContent 1\n\n## Heading 2\n\nContent 2";
    form.append("file", Buffer.from(mdContent), {
      filename: "test.md",
      contentType: "text/markdown",
    });

    const response = await axios.post(
      `${baseUrl}/api/convert?from=markdown&to=html&toc=true&tocDepth=2`,
      form,
      {
        headers: form.getHeaders(),
        responseType: "text",
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toContain("Heading 1");
    expect(response.data).toContain("Heading 2");
  });

  it.skipIf(!pandocAvailable)("sets rate limit headers", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("# Test"), {
      filename: "test.md",
      contentType: "text/markdown",
    });

    const response = await axios.post(`${baseUrl}/api/convert?from=markdown&to=html`, form, {
      headers: form.getHeaders(),
      responseType: "text",
    });

    expect(response.headers["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
    expect(response.headers["x-ratelimit-reset"]).toBeDefined();
  });
});
