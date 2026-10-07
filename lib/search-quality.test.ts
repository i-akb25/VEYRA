import { describe, expect, it } from "vitest";
import { filterWithDiagnostics, matchesRequestedLocation, publicListingUrl } from "./search-quality";
import { dueReminders } from "./reminders";
import { governmentStatus, GOVERNMENT_OPPORTUNITIES } from "./government";
import type { ApplicationRecord } from "./types";
import { locationTerms } from "./locations";

describe("search diagnostics and privacy", () => {
  it("does not silently expand a city to its entire state", () => {
    expect(locationTerms("Lucknow")).not.toContain("uttar pradesh");
    expect(locationTerms("Patna")).not.toContain("bihar");
    expect(locationTerms("Bihar")).toContain("patna");
  });
  it("counts each excluded candidate once with the actual first failing rule", () => {
    const result = filterWithDiagnostics([1, 2, 3, 4], [["even", (n) => n % 2 === 0], ["under four", (n) => n < 4]]);
    expect(result.accepted).toEqual([2]); expect(result.removedBy).toEqual({ even: 2, "under four": 1 });
  });
  it("rejects a different city and permits explicit worldwide remote", () => {
    expect(matchesRequestedLocation({ location: "Mumbai, India" }, ["delhi", "noida"])).toBe(false);
    expect(matchesRequestedLocation({ location: "Noida, India" }, ["delhi", "noida"])).toBe(true);
    expect(matchesRequestedLocation({ location: "Remote US", workplace: "remote", remoteScope: "country-restricted" }, ["delhi"])).toBe(false);
    expect(matchesRequestedLocation({ location: "Worldwide", workplace: "remote", remoteScope: "worldwide" }, ["delhi"])).toBe(true);
  });
  it("removes tracking and token parameters from public reports", () => {
    expect(publicListingUrl("https://jobs.example.org/post/1?email=private&token=secret#resume")).toBe("https://jobs.example.org/post/1");
    expect(publicListingUrl("https://user:password@jobs.example.org/1")).toBe("");
    expect(publicListingUrl("javascript:alert(1)")).toBe("");
  });
});

describe("government lifecycle", () => {
  const record = GOVERNMENT_OPPORTUNITIES.find((item) => item.id === "kcb-accounts-officer-2026")!;
  it("archives a passed deadline without deleting the record", () => expect(governmentStatus(record, Date.parse("2026-10-14T00:00:00Z"))).toBe("closed"));
  it("requires re-review rather than showing stale information as open", () => expect(governmentStatus({ ...record, deadline: "2027-01-01" }, Date.parse("2026-11-01"))).toBe("verify"));
  it("never labels directory links as individual open vacancies", () => expect(governmentStatus({ ...record, kind: "directory" }, Date.parse("2026-10-07"))).toBe("directory"));
});

describe("local reminders", () => {
  const record = { id: "one", job: { title: "Engineer" }, status: "applied", deadline: "2026-10-07", followUp: "2026-10-06" } as ApplicationRecord;
  it("finds due and overdue records by local date", () => {
    const reminders = dueReminders([record], new Date(2026, 9, 7, 10));
    expect(reminders).toHaveLength(2); expect(reminders.map((item) => item.overdue)).toEqual([false, true]);
  });
  it("does not notify rejected, offered, invalid, or future records", () => {
    expect(dueReminders([{ ...record, status: "rejected" }, { ...record, status: "offer" }, { ...record, deadline: "invalid", followUp: "2027-01-01" }], new Date(2026, 9, 7))).toEqual([]);
  });
});
