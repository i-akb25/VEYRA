import { describe, expect, it } from "vitest";
import { GOVERNMENT_OPPORTUNITIES } from "./government";

describe("public opportunity desk", () => {
  it("covers government, PSU, examinations and higher studies", () => {
    for (const category of ["UPSC", "SSC", "BPSC", "Banking", "Railway", "Defence", "PSU", "Apprenticeship", "Higher Studies", "Private Exam"] as const) {
      expect(GOVERNMENT_OPPORTUNITIES.some((item) => item.category === category)).toBe(true);
    }
  });

  it("uses secure official source links", () => {
    expect(GOVERNMENT_OPPORTUNITIES.every((item) => item.officialUrl.startsWith("https://"))).toBe(true);
  });

  it("includes major PSU coverage including IOCL", () => {
    expect(GOVERNMENT_OPPORTUNITIES.some((item) => item.organization.includes("IOCL"))).toBe(true);
    expect(GOVERNMENT_OPPORTUNITIES.filter((item) => item.category === "PSU").length).toBeGreaterThanOrEqual(8);
  });
});
