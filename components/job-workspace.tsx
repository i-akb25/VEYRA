"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ApplicationWorkspace } from "./application-workspace";
import { ResumeProfile } from "./resume-profile";
import { SourceLaunchers } from "./source-launchers";
import { matchesExperienceFilter, scoreJob } from "@/lib/matching";
import type { ApplicationRecord, ApplicationStatus, CandidateProfile, CareerBoard, Job, LocalBackup, SearchFilters, SearchResponse } from "@/lib/types";

const KEYS = { profile: "veyra.profile.v2", saved: "veyra.saved-jobs.v2", applications: "veyra.applications.v1", boards: "veyra.career-boards.v1", seen: "veyra.seen-jobs.v1" };
const emptyProfile: CandidateProfile = { role: "", skills: "", locations: "", experience: "", experienceLevel: "any", graduationYear: "", education: "", remoteOnly: false, recentGraduate: false };
const emptyFilters: SearchFilters = { experienceLevel: "any", postedWithin: "any", company: "", source: "all", employmentType: "", minimumSalary: "" };
type View = "results" | "saved" | "applications" | "sources";

function safeRead<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function safeWrite(key: string, value: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(value)); return localStorage.getItem(key) !== null; } catch { return false; } }
function download(name: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function salaryNumber(value: string) { const lpa = value.match(/([\d.]+)\s?(?:-|–|to)\s?[\d.]+\s?LPA/i); if (lpa) return Number(lpa[1]) * 100000; const raw = value.match(/[₹$]?[\s]?([\d,.]+)/); return raw ? Number(raw[1].replaceAll(",", "")) : 0; }
function safeHttpUrl(value: string) { try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; } }
function safeBoardUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" && ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io", "jobs.lever.co", "api.lever.co", "jobs.ashbyhq.com", "api.ashbyhq.com"].includes(url.hostname.toLowerCase()); } catch { return false; } }

export function JobWorkspace() {
  const [query, setQuery] = useState("software engineer");
  const [location, setLocation] = useState("India");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saved, setSaved] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [careerBoards, setCareerBoards] = useState<CareerBoard[]>([]);
  const [seenJobIds, setSeenJobIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [referenceTime, setReferenceTime] = useState(0);
  const [view, setView] = useState<View>("results");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("saved");
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const storedProfile = safeRead<CandidateProfile | null>(KEYS.profile, null);
      if (storedProfile) { setProfile(storedProfile); setProfileSaved(true); }
      setSaved(safeRead(KEYS.saved, []));
      setApplications(safeRead(KEYS.applications, [])); setCareerBoards(safeRead(KEYS.boards, [])); setSeenJobIds(safeRead(KEYS.seen, []));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const filteredJobs = useMemo(() => {
    const hasProfile = Boolean(profile.role.trim() || profile.skills.trim() || profile.locations.trim());
    const filterList = (source: Job[]) => source.filter((job) => {
      const age = job.publishedAt && referenceTime ? (referenceTime - Date.parse(job.publishedAt)) / 86_400_000 : null;
      const within = filters.postedWithin === "any" || age === null || age <= Number(filters.postedWithin);
      const experience = matchesExperienceFilter(filters.experienceLevel, job.experienceLevel);
      const company = !filters.company || job.company.toLowerCase().includes(filters.company.toLowerCase());
      const sourceMatch = filters.source === "all" || job.source === filters.source;
      const employment = !filters.employmentType || (job.employmentType ?? "").toLowerCase().includes(filters.employmentType.toLowerCase());
      const salary = !filters.minimumSalary || salaryNumber(job.salaryText ?? "") >= Number(filters.minimumSalary);
      return within && experience && company && sourceMatch && employment && salary;
    });
    const score = (items: Job[]) => hasProfile ? items.map((job) => scoreJob(job, profile)).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)) : items;
    return { results: score(filterList(jobs)), saved: score(filterList(saved)) };
  }, [jobs, saved, profile, filters, referenceTime]);
  const visibleJobs = view === "saved" ? filteredJobs.saved : filteredJobs.results;
  const filtersActive = filters.experienceLevel !== "any" || filters.postedWithin !== "any" || Boolean(filters.company || filters.employmentType || filters.minimumSalary) || filters.source !== "all";

  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setWarnings([]); setView("results");
    try {
      const params = new URLSearchParams({ q: query, location, remote: String(remoteOnly), boards: careerBoards.map((board) => board.url).join("\n") });
      const response = await fetch(`/api/jobs/search?${params}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json() as SearchResponse;
      setJobs(data.jobs); setWarnings(data.warnings); setSources(data.sources); setHasSearched(true); setReferenceTime(Date.now());
      const unseen = data.jobs.filter((job) => !seenJobIds.includes(job.id) && job.freshness === "new");
      const updatedSeen = [...new Set([...seenJobIds, ...data.jobs.map((job) => job.id)])].slice(-1500);
      setSeenJobIds(updatedSeen); safeWrite(KEYS.seen, updatedSeen);
      if (unseen.length && "Notification" in window && Notification.permission === "granted") new Notification(`VEYRA found ${unseen.length} new role${unseen.length === 1 ? "" : "s"}`, { body: unseen.slice(0, 2).map((job) => `${job.title} · ${job.company}`).join("\n") });
    } catch { setError("VEYRA could not reach the job sources. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  function changeProfile(next: CandidateProfile) { setProfile(next); setProfileSaved(false); }
  function saveProfile() {
    const stored = safeWrite(KEYS.profile, profile);
    setProfileSaved(stored);
    setNotice(stored ? "Profile saved locally and verified. Use it in search when you want to update the search fields." : "This browser blocked local storage. Your profile was not saved; check privacy settings and try again.");
  }
  function useProfileForSearch() {
    const primaryRole = profile.role.split(/[,;\n]/).map((item) => item.trim()).find(Boolean) ?? "";
    const primaryLocation = profile.locations.split(/[,;\n]/).map((item) => item.trim()).find(Boolean) ?? "";
    if (primaryRole) setQuery(primaryRole);
    if (primaryLocation) setLocation(primaryLocation);
    setRemoteOnly(profile.remoteOnly);
    setFilters((current) => ({ ...current, experienceLevel: profile.experienceLevel, postedWithin: "any" }));
    setNotice("Search fields updated from your profile. Press “Search live roles” to fetch matching openings.");
    document.querySelector<HTMLFormElement>(".search-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function saveBoards(boards: CareerBoard[]) { if (safeWrite(KEYS.boards, boards)) setCareerBoards(boards); else setNotice("This browser blocked local storage, so the career page was not saved."); }
  function persistSaved(next: Job[]) { if (safeWrite(KEYS.saved, next)) setSaved(next); else setNotice("This browser blocked local storage, so the role was not saved."); }
  function persistApplications(next: ApplicationRecord[]) { if (safeWrite(KEYS.applications, next)) setApplications(next); else setNotice("This browser blocked local storage, so the application was not saved."); }
  function toggleSaved(job: Job) { persistSaved(saved.some((item) => item.id === job.id) ? saved.filter((item) => item.id !== job.id) : [job, ...saved]); }
  function track(job: Job) {
    const existing = applications.find((record) => record.job.id === job.id);
    if (existing) { setView("applications"); setApplicationStatus(existing.status); return; }
    persistApplications([{ id: crypto.randomUUID(), job, status: "saved", notes: "", deadline: "", followUp: "", updatedAt: new Date().toISOString() }, ...applications]);
    setNotice("Added to your private application workspace.");
  }
  function updateApplication(record: ApplicationRecord) { persistApplications(applications.map((item) => item.id === record.id ? record : item)); setApplicationStatus(record.status); }

  async function enableNotifications() {
    if (!("Notification" in window)) { setNotice("This browser does not support local notifications."); return; }
    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "Local alerts enabled. They appear after you run a search." : "Notification permission was not granted.");
  }

  function exportJobs(format: "csv" | "json") {
    if (!visibleJobs.length) return;
    if (format === "json") { download("veyra-jobs.json", JSON.stringify(visibleJobs, null, 2), "application/json"); return; }
    const rows = [["Title", "Company", "Location", "Remote", "Experience", "Salary", "Source", "Published", "Match", "URL"], ...visibleJobs.map((job) => [job.title, job.company, job.location, job.remote, job.experienceLevel, job.salaryText ?? "", job.source, job.publishedAt, job.matchScore ?? "", job.url])];
    download("veyra-jobs.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  function exportBackup() {
    const backup: LocalBackup = { version: 1, exportedAt: new Date().toISOString(), profile, saved, applications, careerBoards, seenJobIds };
    download(`veyra-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), "application/json");
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as LocalBackup;
      if (data.version !== 1 || !data.profile || !Array.isArray(data.saved) || !Array.isArray(data.applications) || !Array.isArray(data.careerBoards) ||
        data.saved.some((job) => !safeHttpUrl(job.url)) || data.applications.some((record) => !safeHttpUrl(record.job.url)) || data.careerBoards.some((board) => !safeBoardUrl(board.url))) throw new Error();
      setProfile(data.profile); persistSaved(data.saved); persistApplications(data.applications); saveBoards(data.careerBoards); setSeenJobIds(data.seenJobIds ?? []);
      safeWrite(KEYS.profile, data.profile); safeWrite(KEYS.seen, data.seenJobIds ?? []); setProfileSaved(true); setNotice("Local VEYRA backup restored.");
    } catch { setNotice("This is not a valid VEYRA backup."); }
    event.target.value = "";
  }

  return (
    <section className="workspace" id="search">
      <div className="workspace-heading"><div><p className="eyebrow">Live opportunity desk</p><h2>Search less.<br />Decide better.</h2></div><p>Live feeds, direct company career pages, private resume matching and an application workspace without an account or database.</p></div>
      <form className="search-bar" onSubmit={search}>
        <label><span>Role, skill or exam</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React engineer, GET, electrical" maxLength={100} /></label>
        <label><span>Location demand</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="India, Bihar, Bengaluru, Remote" maxLength={100} /></label>
        <label><span>Experience</span><select value={filters.experienceLevel} onChange={(event) => setFilters({ ...filters, experienceLevel: event.target.value as SearchFilters["experienceLevel"] })}><option value="any">Any level</option><option value="fresher">Freshers</option><option value="entry">0–2 years</option><option value="experienced">3+ years</option></select></label>
        <label className="check-label"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /><span>Remote only</span></label>
        <button className="button primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search live roles"}</button>
      </form>

      <div className="desk">
        <ResumeProfile profile={profile} saved={profileSaved} onChange={changeProfile} onSave={saveProfile} onUseForSearch={useProfileForSearch} />
        <div className="results-panel" aria-live="polite">
          <div className="results-tools">
            <div className="tabs">
              <button className={view === "results" ? "active" : ""} onClick={() => setView("results")}>Results <span>{filteredJobs.results.length}{filteredJobs.results.length !== jobs.length ? ` / ${jobs.length}` : ""}</span></button>
              <button className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}>Saved <span>{saved.length}</span></button>
              <button className={view === "applications" ? "active" : ""} onClick={() => setView("applications")}>Applications <span>{applications.length}</span></button>
              <button className={view === "sources" ? "active" : ""} onClick={() => setView("sources")}>Sources{careerBoards.length > 0 && <span>{careerBoards.length} added</span>}</button>
            </div>
            <div className="exports"><button onClick={() => exportJobs("csv")} disabled={!visibleJobs.length}>CSV ↓</button><button onClick={() => exportJobs("json")} disabled={!visibleJobs.length}>JSON ↓</button><button onClick={exportBackup}>Backup ↓</button><button onClick={() => restoreRef.current?.click()}>Restore ↑</button><input ref={restoreRef} hidden type="file" accept="application/json,.json" onChange={restoreBackup} /></div>
          </div>
          {notice && <p className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></p>}
          {view === "sources" && <SourceLaunchers query={query} location={location} boards={careerBoards} onBoardsChange={saveBoards} />}
          {view === "applications" && <ApplicationWorkspace records={applications} activeStatus={applicationStatus} onStatusChange={setApplicationStatus} onUpdate={updateApplication} onRemove={(id) => persistApplications(applications.filter((item) => item.id !== id))} />}
          {(view === "results" || view === "saved") && <>
            <div className="filter-bar">
              <label><span>Posted</span><select value={filters.postedWithin} onChange={(event) => setFilters({ ...filters, postedWithin: event.target.value as SearchFilters["postedWithin"] })}><option value="1">24 hours</option><option value="7">7 days</option><option value="30">30 days</option><option value="any">Any time</option></select></label>
              <label><span>Company</span><input value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })} placeholder="Company" /></label>
              <label><span>Source</span><select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value as SearchFilters["source"] })}><option value="all">All sources</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
              <label><span>Job type</span><input value={filters.employmentType} onChange={(event) => setFilters({ ...filters, employmentType: event.target.value })} placeholder="Full-time, contract" /></label>
              <label><span>Minimum salary</span><input inputMode="numeric" value={filters.minimumSalary} onChange={(event) => setFilters({ ...filters, minimumSalary: event.target.value.replace(/\D/g, "") })} placeholder="₹ per year" /></label>
              <button onClick={enableNotifications}>Enable local alerts</button>
              {filtersActive && <button className="clear-filters" onClick={() => setFilters(emptyFilters)}>Clear filters</button>}
            </div>
            {warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}{error && <p className="error">{error}</p>}
            {!hasSearched && view === "results" && !loading && <div className="empty-state"><span>↳</span><h3>Your shortlist starts here.</h3><p>Run a search or add company career pages under Sources.</p></div>}
            {hasSearched && view === "results" && !loading && visibleJobs.length === 0 && <div className="empty-state"><span>0</span><h3>{jobs.length ? `${jobs.length} found, but filters hid them.` : "No live matches found."}</h3><p>{jobs.length ? "Your search worked. Clear the result filters to see every role that was returned." : "Try a broader role or location, or add company career pages under Sources."}</p>{jobs.length > 0 && <button className="button primary" onClick={() => setFilters(emptyFilters)}>Show all {jobs.length} roles</button>}</div>}
            {view === "saved" && saved.length === 0 && <div className="empty-state"><span>♡</span><h3>No saved roles yet.</h3><p>Save roles from results. They stay only on this device.</p></div>}
            <div className="job-list">{visibleJobs.map((job) => <JobCard key={job.id} job={job} saved={saved.some((item) => item.id === job.id)} tracked={applications.some((item) => item.job.id === job.id)} onSave={() => toggleSaved(job)} onTrack={() => track(job)} />)}</div>
          </>}
        </div>
      </div>
    </section>
  );
}

function JobCard({ job, saved, tracked, onSave, onTrack }: { job: Job; saved: boolean; tracked: boolean; onSave: () => void; onTrack: () => void }) {
  return <article className="job-card">
    <div className="job-top"><div><p className="job-source">{job.source} · {job.remote ? "Remote" : "On-site / hybrid"} · {job.freshness}</p><h3>{job.title}</h3><p className="company">{job.company} <span>·</span> {job.location}</p></div>{job.matchScore && <div className="score"><strong>{job.matchScore}</strong><span>fit</span></div>}</div>
    <div className="job-meta"><span>{job.experienceLevel === "any" ? "Level not stated" : job.experienceLevel}</span>{job.employmentType && <span>{job.employmentType}</span>}{job.salaryText && <span>{job.salaryText}</span>}{job.publishedAt && <span>{new Date(job.publishedAt).toLocaleDateString()}</span>}</div>
    {job.matchReasons && <p className="reasons">{job.matchReasons.join(" · ")}</p>}
    {job.missingSkills && job.missingSkills.length > 0 && <p className="missing-skills">Not found in listing: {job.missingSkills.join(", ")}. Verify manually; job descriptions are incomplete.</p>}
    <p className="description">{job.description || "Open the source listing for full role details."}</p>
    <div className="tags">{job.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="job-actions"><a href={job.url} target="_blank" rel="noopener noreferrer">View original listing ↗</a><div><button onClick={onSave}>{saved ? "Remove saved" : "Save role"}</button><button onClick={onTrack}>{tracked ? "Open tracker" : "Track application"}</button></div></div>
  </article>;
}
