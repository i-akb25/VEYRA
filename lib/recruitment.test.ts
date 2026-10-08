import { describe, expect, it } from "vitest";
import { recruitmentTypes, sourceFacts } from "./recruitment";
describe("source-grounded recruitment facts", () => {
  it("does not confuse off-campus with campus or an experienced recruiter with a fresher", () => {
    expect(recruitmentTypes({title: "Off-campus drive", description: "Graduate engineer trainee; freshers welcome"})).toEqual(["off-campus", "fresher", "graduate"]);
    expect(recruitmentTypes({title: "Senior recruiter", description: "Manage graduate programmes"})).not.toContain("fresher");
  });
  it("does not interpret posting totals as role headcount or invent dates", () => {
    expect(sourceFacts({totalFound: 500, numberOfPositions: "many", validThrough: "soon"})).toEqual({closesAt: undefined, openings: undefined});
    expect(sourceFacts({totalJobOpenings: 12, validThrough: "2026-12-01"})).toEqual({openings: 12, closesAt: "2026-12-01"});
  });
});
