import { describe, expect, it } from "vitest";
import { profileFromResume } from "./resume";
import type { CandidateProfile } from "./types";

const empty: CandidateProfile = { role: "", skills: "", locations: "", experience: "", experienceLevel: "any", graduationYear: "", education: "", remoteOnly: false, recentGraduate: false };

describe("local resume profile extraction", () => {
  it("extracts engineering roles, skills, education and the latest graduation year", () => {
    const text = "B.Tech Electrical Engineering, NIT Patna, 2021 - 2025. Graduate Engineer Trainee. Skills: PLC, SCADA, MATLAB, React, TypeScript.";
    const profile = profileFromResume(text, empty);
    expect(profile.role).toContain("graduate engineer trainee");
    expect(profile.skills).toContain("plc");
    expect(profile.skills).toContain("typescript");
    expect(profile.education.toLowerCase()).toContain("b.tech");
    expect(profile.graduationYear).toBe("2025");
    expect(profile.recentGraduate).toBe(true);
  });
});
