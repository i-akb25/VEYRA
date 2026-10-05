import { describe, expect, it } from "vitest";
import { locationTerms } from "./locations";
import { occupationMatches, occupationPhrases } from "./occupations";

describe("public search benchmarks", () => {
  it.each([
    ["Front Desk Executive", "receptionist"],
    ["Back Office Executive", "office-administrator"],
    ["Business Development Executive", "sales-executive"],
    ["Staff Nurse - ICU", "nurse"],
    ["Guest Service Associate", "hotel-operations"],
    ["Community Mobiliser", "ngo-programme-associate"],
    ["PLC Controls Engineer", "automation-engineer"],
    ["Graduate Engineer Trainee", "graduate-trainee"]
  ])("maps %s to %s", (title, role) => expect(occupationMatches(title, role)).toBe(true));

  it("expands Indian job-title synonyms", () => {
    expect(occupationPhrases(["office-administrator"])).toEqual(expect.arrayContaining(["back office executive", "admin executive", "office assistant"]));
  });

  it("expands Delhi NCR and tier-2 clusters without geocoding", () => {
    expect(locationTerms("Delhi NCR")).toEqual(expect.arrayContaining(["delhi", "noida", "gurugram", "faridabad", "ghaziabad"]));
    expect(locationTerms("Patna")).toEqual(expect.arrayContaining(["patna", "hajipur", "bihta"]));
  });
});
