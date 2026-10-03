import { describe, expect, it } from "vitest";
import { deduplicateJobs, getFreshness, inferExperience, scoreJob } from "./matching";
import type { CandidateProfile, Job } from "./types";

const job: Job = {
  id: "1", title: "Frontend Engineer", company: "Example", location: "Remote, India",
  remote: true, source: "Remotive", url: "https://example.com", publishedAt: "2026-01-01",
  description: "Build interfaces with React and TypeScript", tags: ["react", "typescript"],
  experienceLevel: "entry", freshness: "recent"
};

const profile: CandidateProfile = {
  role: "software frontend engineer", skills: "React TypeScript", locations: "India", experience: "1 year",
  experienceLevel: "entry", graduationYear: "2025", education: "B.Tech", remoteOnly: true, recentGraduate: true
};

it("rewards role, skill and remote alignment", () => {
  const result = scoreJob(job, profile);
  expect(result.matchScore).toBeGreaterThan(75);
  expect(result.matchReasons).toContain("Remote-friendly");
});

describe("privacy-safe matcher", () => {
  it("does not mutate the input job", () => {
    scoreJob(job, profile);
    expect(job.matchScore).toBeUndefined();
  });
});

it("classifies fresher and experienced roles", () => {
  expect(inferExperience("Graduate Engineer Trainee")).toBe("fresher");
  expect(inferExperience("Senior engineer with 5+ years")).toBe("experienced");
});

it("deduplicates equivalent listings", () => {
  expect(deduplicateJobs([job, { ...job, id: "2" }])).toHaveLength(1);
});

it("marks invalid dates as unknown", () => {
  expect(getFreshness("")).toBe("unknown");
});
