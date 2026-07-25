import { describe, it, expect } from "vitest";
import {
  DAILY_USAGE_LIMIT,
  MAX_TEXT_LENGTH,
  MAX_KEYWORDS_TEXT_LENGTH,
  MAX_SEARCH_LIMIT,
  MAX_KEYWORDS_COUNT,
  MAX_PAPERS_COUNT,
  MAX_WORKS_LIMIT,
  MAX_FILE_SIZE,
  AI_TIMEOUT_MS,
  SEARCH_TIMEOUT_MS,
} from "@/lib/config";

describe("config constants", () => {
  it("should have reasonable daily usage limit", () => {
    expect(DAILY_USAGE_LIMIT).toBeGreaterThan(0);
    expect(DAILY_USAGE_LIMIT).toBeLessThanOrEqual(100);
  });

  it("should have reasonable text length limits", () => {
    expect(MAX_TEXT_LENGTH).toBeGreaterThan(0);
    expect(MAX_KEYWORDS_TEXT_LENGTH).toBeGreaterThan(MAX_TEXT_LENGTH);
  });

  it("should have reasonable search limits", () => {
    expect(MAX_SEARCH_LIMIT).toBeGreaterThan(0);
    expect(MAX_KEYWORDS_COUNT).toBeGreaterThan(0);
    expect(MAX_PAPERS_COUNT).toBeGreaterThan(0);
    expect(MAX_WORKS_LIMIT).toBeGreaterThan(0);
  });

  it("should have reasonable file size limit", () => {
    expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    // Should be between 1MB and 100MB
    expect(MAX_FILE_SIZE).toBeGreaterThanOrEqual(1024 * 1024);
    expect(MAX_FILE_SIZE).toBeLessThanOrEqual(100 * 1024 * 1024);
  });

  it("should have reasonable timeout values", () => {
    expect(AI_TIMEOUT_MS).toBeGreaterThanOrEqual(10000);
    expect(AI_TIMEOUT_MS).toBeLessThanOrEqual(300000);
    expect(SEARCH_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
    expect(SEARCH_TIMEOUT_MS).toBeLessThanOrEqual(60000);
  });
});
