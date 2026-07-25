import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // 每个测试用不同的 identifier 避免状态污染
  });

  it("should allow first request", () => {
    const result = checkRateLimit("test-user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should track request count", () => {
    const id = "test-user-2";
    checkRateLimit(id);
    checkRateLimit(id);
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it("should block after max requests", () => {
    const id = "test-user-3";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(id);
    }
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should support custom config", () => {
    const id = "test-user-4";
    const config = { maxRequests: 3, windowMs: 60000 };
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const result = checkRateLimit(id, config);
    expect(result.allowed).toBe(false);
  });

  it("should isolate different identifiers", () => {
    const id1 = "test-user-5a";
    const id2 = "test-user-5b";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(id1);
    }
    const result = checkRateLimit(id2);
    expect(result.allowed).toBe(true);
  });
});
