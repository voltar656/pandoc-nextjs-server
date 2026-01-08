import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";
import { rateLimit } from "../../lib/rateLimit";

function createMockReq(ip: string = "127.0.0.1"): NextApiRequest {
  return {
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: ip },
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse & {
  statusCode: number;
  headers: Record<string, string | number>;
  body: unknown;
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string | number>,
    body: null as unknown,
    setHeader(name: string, value: string | number) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as NextApiResponse & {
    statusCode: number;
    headers: Record<string, string | number>;
    body: unknown;
  };
}

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const req = createMockReq("192.168.1." + Math.random());
    const res = createMockRes();

    const allowed = rateLimit(req, res);

    expect(allowed).toBe(true);
    expect(res.headers["X-RateLimit-Limit"]).toBe(30);
    expect(res.headers["X-RateLimit-Remaining"]).toBe(29);
  });

  it("sets rate limit headers", () => {
    const req = createMockReq("192.168.2." + Math.random());
    const res = createMockRes();

    rateLimit(req, res);

    expect(res.headers["X-RateLimit-Limit"]).toBeDefined();
    expect(res.headers["X-RateLimit-Remaining"]).toBeDefined();
    expect(res.headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("decrements remaining count on each request", () => {
    const uniqueIp = "192.168.3." + Math.floor(Math.random() * 255);
    const req = createMockReq(uniqueIp);

    const res1 = createMockRes();
    rateLimit(req, res1);
    expect(res1.headers["X-RateLimit-Remaining"]).toBe(29);

    const res2 = createMockRes();
    rateLimit(req, res2);
    expect(res2.headers["X-RateLimit-Remaining"]).toBe(28);
  });

  it("blocks requests over the limit", () => {
    const uniqueIp = "10.0.0." + Math.floor(Math.random() * 255);
    const req = createMockReq(uniqueIp);

    // Make 30 requests (the limit)
    for (let i = 0; i < 30; i++) {
      const res = createMockRes();
      const allowed = rateLimit(req, res);
      expect(allowed).toBe(true);
    }

    // 31st request should be blocked
    const res = createMockRes();
    const allowed = rateLimit(req, res);

    expect(allowed).toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.headers["X-RateLimit-Remaining"]).toBe(0);
  });

  it("tracks different IPs separately", () => {
    const ip1 = "172.16.1." + Math.floor(Math.random() * 255);
    const ip2 = "172.16.2." + Math.floor(Math.random() * 255);

    const req1 = createMockReq(ip1);
    const req2 = createMockReq(ip2);

    // Make requests from IP1
    for (let i = 0; i < 5; i++) {
      rateLimit(req1, createMockRes());
    }

    // IP2 should still have full quota
    const res2 = createMockRes();
    rateLimit(req2, res2);
    expect(res2.headers["X-RateLimit-Remaining"]).toBe(29);
  });
});
