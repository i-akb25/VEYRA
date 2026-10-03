import { describe, expect, it } from "vitest";
import { employerRegistry, employersForSearch, publicBoardUrl } from "./employers";

describe("employer registry", () => {
  it("covers India and international searches", () => {
    expect(employersForSearch("sales", "india").some((item) => item.regions.includes("india"))).toBe(true);
    expect(employersForSearch("sales", "international").every((item) => item.regions.includes("international"))).toBe(true);
  });

  it("covers non-software role families", () => {
    for (const category of ["sales", "marketing", "management", "finance", "hr", "design", "operations", "support", "healthcare"] as const) {
      expect(employerRegistry.some((item) => item.categories.includes(category))).toBe(true);
    }
  });

  it("builds HTTPS public board URLs for every provider", () => {
    expect(employerRegistry.every((item) => publicBoardUrl(item).startsWith("https://"))).toBe(true);
  });
});
