import { describe, expect, it } from "vitest";
import { extractEligibility } from "./eligibility";
import type { Job } from "./types";

function job(overrides: Partial<Job> = {}): Job {
  return { id: "1", title: "Engineer", company: "Example", location: "Toronto, Canada", remote: true, workplace: "remote", source: "Greenhouse", url: "https://example.com/job", publishedAt: "2026-10-01", description: "", tags: [], experienceLevel: "any", freshness: "new", ...overrides };
}

describe("eligibility extraction", () => {
  it("extracts only information stated in the listing", () => {
    const result = extractEligibility(job({ description: "Remote in Canada only. At least 2 years of experience. Visa sponsorship is available. Fluent English required. Relocation assistance is provided. Salary USD 90,000." }));
    expect(result.country).toBe("Canada");
    expect(result.remoteScope).toBe("country-restricted");
    expect(result.visaSponsorship).toBe("yes");
    expect(result.experienceRange).toContain("2 years");
    expect(result.requiredLanguage).toBe("English");
    expect(result.relocation).toBe("yes");
  });

  it("uses Not stated values instead of guessing", () => {
    const result = extractEligibility(job({ location: "Remote", description: "Join our team." }));
    expect(result.country).toBe("Not stated");
    expect(result.visaSponsorship).toBe("not-stated");
    expect(result.workAuthorization).toBe("Not stated");
    expect(result.qualification).toBe("Not stated");
    expect(result.requiredLanguage).toBe("Not stated");
  });

  it("distinguishes worldwide and restricted remote work", () => {
    expect(extractEligibility(job({ location: "Worldwide" })).remoteScope).toBe("worldwide");
    expect(extractEligibility(job({ description: "Candidates must be based in the United States." })).remoteScope).toBe("country-restricted");
  });
});
