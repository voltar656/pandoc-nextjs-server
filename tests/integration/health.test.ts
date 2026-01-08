import { describe, it, expect, beforeAll } from "vitest";
import { createMocks } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";
import { execSync } from "child_process";

import handler from "../../pages/api/health";

// Check if pandoc is available
let pandocAvailable = false;
try {
  execSync("pandoc --version", { stdio: "ignore" });
  pandocAvailable = true;
} catch {
  pandocAvailable = false;
}

describe("/api/health", () => {
  it.skipIf(!pandocAvailable)(
    "returns 200 with pandoc version when pandoc is available",
    async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe("ok");
      expect(data.pandoc).toMatch(/^\d+\.\d+/);
    }
  );

  it("returns health response structure", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("pandoc");
    expect(["ok", "degraded"]).toContain(data.status);
  });

  it.skipIf(pandocAvailable)("returns 503 degraded when pandoc is unavailable", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(503);
    const data = JSON.parse(res._getData());
    expect(data.status).toBe("degraded");
    expect(data.pandoc).toBe("unavailable");
  });
});
