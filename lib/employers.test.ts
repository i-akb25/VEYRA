import { describe, expect, it } from "vitest";
import { employerRegistry, employersForSearch, publicBoardUrl } from "./employers";
import { employerDirectory } from "./employer-directory";

describe("employer registry", () => {
  it("has at least 100 distinct verified ATS employers, separately from portal links", () => {
    expect(employerRegistry.length).toBeGreaterThanOrEqual(100);
    expect(new Set(employerRegistry.map((item) => item.name.toLowerCase())).size).toBe(employerRegistry.length);
    expect(employerRegistry.filter((item) => item.verifiedAt && (item.verifiedJobCount ?? 0) > 0).length).toBeGreaterThanOrEqual(100);
  });
  it("covers India and international searches", () => {
    expect(employersForSearch("sales", "india").some((item) => item.regions.includes("india"))).toBe(true);
    expect(employersForSearch("sales", "international").every((item) => item.regions.includes("international"))).toBe(true);
  });

  it("covers non-software role families", () => {
    for (const category of ["sales", "marketing", "management", "finance", "hr", "design", "operations", "support", "healthcare", "education", "administration", "hospitality", "retail", "construction", "science", "legal", "media", "agriculture", "social"] as const) {
      expect(employerRegistry.some((item) => item.categories.includes(category))).toBe(true);
    }
  });

  it("builds HTTPS public board URLs for every provider", () => {
    expect(employerRegistry.every((item) => publicBoardUrl(item).startsWith("https://"))).toBe(true);
  });

  it("covers representative public searches across India and international markets", () => {
    for (const category of ["software", "electrical", "healthcare", "sales", "marketing", "get"] as const) {
      expect(employersForSearch(category, "india").length).toBeGreaterThan(0);
      expect(employersForSearch(category, "international").length).toBeGreaterThan(0);
    }
  });

  it("provides at least 100 official employer career sources", () => {
    expect(employerDirectory.length).toBeGreaterThanOrEqual(100);
    expect(new Set(employerDirectory.map((item) => item.name)).size).toBe(employerDirectory.length);
    expect(employerDirectory.every((item) => item.careersUrl.startsWith("https://"))).toBe(true);
  });

  it("falls back to diverse regional feeds for newly added public role families", () => {
    for (const category of ["administration", "media", "agriculture", "social", "education", "hospitality"] as const) {
      expect(employersForSearch(category, "any").length).toBeGreaterThan(0);
    }
  });
});
