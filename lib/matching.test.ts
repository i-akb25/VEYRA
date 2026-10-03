import { describe, expect, it } from "vitest";
import { scoreJob } from "./matching";
import type { CandidateProfile, Job } from "./types";

const job: Job = {
  id: "1", title: "Frontend Engineer", company: "Example", location: "Remote, India",
  remote: true, source: "Remotive", url: "https://example.com", publishedAt: "2026-01-01",
  description: "Build interfaces with React and TypeScript", tags: ["react", "typescript"]
};

it("rewards role, skill and remote alignment", () => {
  const profile: CandidateProfile = { role: "software frontend engineer", skills: "React TypeScript", locations: "India", experience: "1", remoteOnly: true };
  const result = scoreJob(job, profile);
  expect(result.matchScore).toBeGreaterThan(75);
  expect(result.matchReasons).toContain("Remote-friendly");
});

describe("privacy-safe matcher", () => {
  it("does not mutate the input job", () => {
    const profile: CandidateProfile = { role: "frontend", skills: "React", locations: "", experience: "", remoteOnly: false };
    scoreJob(job, profile);
    expect(job.matchScore).toBeUndefined();
  });
});
