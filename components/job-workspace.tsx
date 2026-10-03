"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { scoreJob } from "@/lib/matching";
import type { CandidateProfile, Job, SearchResponse } from "@/lib/types";

const PROFILE_KEY = "veyra.profile.v1";
const SAVED_KEY = "veyra.saved-jobs.v1";
const emptyProfile: CandidateProfile = { role: "", skills: "", locations: "", experience: "", remoteOnly: false };

function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function JobWorkspace() {
  const [query, setQuery] = useState("software engineer");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [saved, setSaved] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [tab, setTab] = useState<"results" | "saved">("results");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setProfile(safeRead(PROFILE_KEY, emptyProfile));
      setSaved(safeRead(SAVED_KEY, []));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const rankedJobs = useMemo(() => {
    const hasProfile = Boolean(profile.role.trim() || profile.skills.trim() || profile.locations.trim());
    const source = tab === "saved" ? saved : jobs;
    return hasProfile
      ? source.map((job) => scoreJob(job, profile)).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      : source;
  }, [jobs, saved, profile, tab]);

  async function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setWarnings([]);
    setTab("results");
    try {
      const params = new URLSearchParams({ q: query, location, remote: String(remoteOnly) });
      const response = await fetch(`/api/jobs/search?${params}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json() as SearchResponse;
      setJobs(data.jobs);
      setWarnings(data.warnings);
      setHasSearched(true);
    } catch {
      setError("VEYRA could not reach the job sources. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function toggleSaved(job: Job) {
    const exists = saved.some((item) => item.id === job.id);
    const updated = exists ? saved.filter((item) => item.id !== job.id) : [job, ...saved];
    setSaved(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  }

  function exportJobs(format: "csv" | "json") {
    if (!rankedJobs.length) return;
    if (format === "json") {
      download("veyra-jobs.json", JSON.stringify(rankedJobs, null, 2), "application/json");
      return;
    }
    const rows = [
      ["Title", "Company", "Location", "Remote", "Source", "Published", "Match", "URL"],
      ...rankedJobs.map((job) => [job.title, job.company, job.location, job.remote, job.source, job.publishedAt, job.matchScore ?? "", job.url])
    ];
    download("veyra-jobs.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  return (
    <section className="workspace" id="search">
      <div className="workspace-heading">
        <div><p className="eyebrow">Live opportunity desk</p><h2>Search less.<br />Decide better.</h2></div>
        <p>Search across open job feeds now. Add a private profile only if you want ranked, explainable matches.</p>
      </div>

      <form className="search-bar" onSubmit={search}>
        <label><span>Role or skill</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. React engineer" maxLength={100} /></label>
        <label><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="India, Berlin, Remote" maxLength={100} /></label>
        <label className="check-label"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /><span>Remote only</span></label>
        <button className="button primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search live roles"}</button>
      </form>

      <div className="desk">
        <aside className="profile-panel" id="profile">
          <div className="panel-title"><span>Private profile</span><small>Stored locally</small></div>
          <p className="panel-copy">Optional. This improves ranking but is never sent with the search request.</p>
          <form onSubmit={saveProfile}>
            <label><span>Target roles</span><input value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value })} placeholder="Software, electrical, automation" /></label>
            <label><span>Skills</span><textarea value={profile.skills} onChange={(event) => setProfile({ ...profile, skills: event.target.value })} placeholder="React, TypeScript, PLC, control systems…" rows={4} /></label>
            <label><span>Preferred locations</span><input value={profile.locations} onChange={(event) => setProfile({ ...profile, locations: event.target.value })} placeholder="India, Remote" /></label>
            <label><span>Experience</span><input value={profile.experience} onChange={(event) => setProfile({ ...profile, experience: event.target.value })} placeholder="Graduate / 1 year" /></label>
            <label className="check-label"><input type="checkbox" checked={profile.remoteOnly} onChange={(event) => setProfile({ ...profile, remoteOnly: event.target.checked })} /><span>Prioritise remote roles</span></label>
            <button className="button secondary" type="submit">Save on this device</button>
          </form>
          <p className="privacy-note"><span>●</span> Browser storage only. Clear it anytime from your browser settings.</p>
        </aside>

        <div className="results-panel" aria-live="polite">
          <div className="results-tools">
            <div className="tabs">
              <button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}>Results <span>{jobs.length}</span></button>
              <button className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>Saved <span>{saved.length}</span></button>
            </div>
            <div className="exports"><button onClick={() => exportJobs("csv")} disabled={!rankedJobs.length}>CSV ↓</button><button onClick={() => exportJobs("json")} disabled={!rankedJobs.length}>JSON ↓</button></div>
          </div>

          {warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
          {error && <p className="error">{error}</p>}
          {!hasSearched && tab === "results" && !loading && (
            <div className="empty-state"><span>↳</span><h3>Your shortlist starts here.</h3><p>Run a search to pull current openings from supported public job feeds.</p></div>
          )}
          {hasSearched && tab === "results" && !loading && jobs.length === 0 && (
            <div className="empty-state"><span>0</span><h3>No exact matches.</h3><p>Try a broader role, remove the location, or switch off remote-only.</p></div>
          )}
          {tab === "saved" && saved.length === 0 && (
            <div className="empty-state"><span>♡</span><h3>No saved roles yet.</h3><p>Save a role from your results and it will stay on this device.</p></div>
          )}

          <div className="job-list">
            {rankedJobs.map((job) => {
              const isSaved = saved.some((item) => item.id === job.id);
              return (
                <article className="job-card" key={job.id}>
                  <div className="job-top">
                    <div><p className="job-source">{job.source} · {job.remote ? "Remote" : "On-site / hybrid"}</p><h3>{job.title}</h3><p className="company">{job.company} <span>·</span> {job.location}</p></div>
                    {job.matchScore && <div className="score"><strong>{job.matchScore}</strong><span>fit</span></div>}
                  </div>
                  {job.matchReasons && <p className="reasons">{job.matchReasons.join(" · ")}</p>}
                  <p className="description">{job.description || "Open the source listing for full role details."}</p>
                  <div className="tags">{job.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="job-actions">
                    <a href={job.url} target="_blank" rel="noopener noreferrer">View original listing ↗</a>
                    <button onClick={() => toggleSaved(job)}>{isSaved ? "Remove saved" : "Save role"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
