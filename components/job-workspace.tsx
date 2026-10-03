"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ApplicationWorkspace } from "./application-workspace";
import { GovernmentDesk } from "./government-desk";
import { ResumeProfile } from "./resume-profile";
import { SourceLaunchers } from "./source-launchers";
import { matchesExperienceFilter, scoreJob } from "@/lib/matching";
import type { ApplicationRecord, ApplicationStatus, CandidateProfile, CareerBoard, GeographyScope, Job, LocalBackup, RoleCategory, SearchFilters, SearchPreset, SearchResponse, SourceHealth, WorkplaceMode } from "@/lib/types";

const KEYS = { profile: "veyra.profile.v2", saved: "veyra.saved-jobs.v2", applications: "veyra.applications.v1", boards: "veyra.career-boards.v1", seen: "veyra.seen-jobs.v1", presets: "veyra.search-presets.v1", hidden: "veyra.hidden-jobs.v1" };
const emptyProfile: CandidateProfile = { role: "", skills: "", locations: "", experience: "", experienceLevel: "any", graduationYear: "", education: "", remoteOnly: false, recentGraduate: false };
const emptyFilters: SearchFilters = { experienceLevel: "any", postedWithin: "any", company: "", source: "all", employmentType: "", minimumSalary: "", qualification: "any" };
type View = "results" | "saved" | "applications" | "government" | "sources";
const PAGE_SIZE = 12;

function safeRead<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function safeWrite(key: string, value: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(value)); return localStorage.getItem(key) !== null; } catch { return false; } }
function download(name: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function salaryNumber(value: string) { const lpa = value.match(/([\d.]+)\s?(?:-|–|to)\s?[\d.]+\s?LPA/i); if (lpa) return Number(lpa[1]) * 100000; const raw = value.match(/[₹$]?[\s]?([\d,.]+)/); return raw ? Number(raw[1].replaceAll(",", "")) : 0; }
function safeHttpUrl(value: string) { try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; } }
function safeBoardUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" && ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io", "jobs.lever.co", "api.lever.co", "jobs.ashbyhq.com", "api.ashbyhq.com", "jobs.smartrecruiters.com", "api.smartrecruiters.com"].includes(url.hostname.toLowerCase()); } catch { return false; } }

export function JobWorkspace() {
  const [query, setQuery] = useState("software engineer");
  const [roleCategory, setRoleCategory] = useState<RoleCategory>("software");
  const [location, setLocation] = useState("India");
  const [scope, setScope] = useState<GeographyScope>("india");
  const [workplace, setWorkplace] = useState<WorkplaceMode>("any");
  const [negativeKeywords, setNegativeKeywords] = useState("senior, lead, principal");
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saved, setSaved] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [careerBoards, setCareerBoards] = useState<CareerBoard[]>([]);
  const [seenJobIds, setSeenJobIds] = useState<string[]>([]);
  const [searchPresets, setSearchPresets] = useState<SearchPreset[]>([]);
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [referenceTime, setReferenceTime] = useState(0);
  const [view, setView] = useState<View>("results");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("saved");
  const [page, setPage] = useState(1);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const restoreRef = useRef<HTMLInputElement>(null);

  function selectRoleCategory(next: RoleCategory) {
    setRoleCategory(next);
    const defaults: Record<RoleCategory, string> = { software: "software engineer", electrical: "electrical engineer", automation: "automation engineer", get: "graduate engineer trainee", sales: "sales", marketing: "marketing", management: "manager", finance: "financial analyst", hr: "human resources", design: "product designer", data: "data analyst", operations: "operations", support: "customer support", healthcare: "healthcare", remote: "", custom: "" };
    setQuery(defaults[next]);
    if (next === "get") setFilters((current) => ({ ...current, experienceLevel: "fresher" }));
    if (next === "remote") setWorkplace("remote");
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const storedProfile = safeRead<CandidateProfile | null>(KEYS.profile, null);
      if (storedProfile) { setProfile(storedProfile); setProfileSaved(true); }
      setSaved(safeRead(KEYS.saved, []));
      setApplications(safeRead(KEYS.applications, [])); setCareerBoards(safeRead(KEYS.boards, [])); setSeenJobIds(safeRead(KEYS.seen, [])); setSearchPresets(safeRead(KEYS.presets, [])); setHiddenJobIds(safeRead(KEYS.hidden, []));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const wentOnline = () => setOnline(true); const wentOffline = () => setOnline(false);
    window.addEventListener("online", wentOnline); window.addEventListener("offline", wentOffline);
    return () => { window.removeEventListener("online", wentOnline); window.removeEventListener("offline", wentOffline); };
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
      const qualificationTerms = ({ any: [], btech: ["b.tech", "btech", "b.e", "bachelor of engineering"], degree: ["degree", "bachelor", "graduate"], diploma: ["diploma"], iti: ["iti", "industrial training institute"] } as const)[filters.qualification];
      const qualification = qualificationTerms.length === 0 || qualificationTerms.some((term) => `${job.title} ${job.description}`.toLowerCase().includes(term));
      return !hiddenJobIds.includes(job.id) && within && experience && company && sourceMatch && employment && salary && qualification;
    });
    const score = (items: Job[]) => hasProfile ? items.map((job) => scoreJob(job, profile)).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)) : items;
    return { results: score(filterList(jobs)), saved: score(filterList(saved)) };
  }, [jobs, saved, profile, filters, referenceTime, hiddenJobIds]);
  const visibleJobs = view === "saved" ? filteredJobs.saved : filteredJobs.results;
  const filtersActive = filters.experienceLevel !== "any" || filters.postedWithin !== "any" || Boolean(filters.company || filters.employmentType || filters.minimumSalary) || filters.source !== "all" || filters.qualification !== "any";
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedJobs = visibleJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setWarnings([]); setView("results");
    try {
      const params = new URLSearchParams({ q: query, category: roleCategory, location, scope, workplace, experience: filters.experienceLevel, qualification: filters.qualification, negative: negativeKeywords, boards: careerBoards.map((board) => board.url).join("\n") });
      const response = await fetch(`/api/jobs/search?${params}`);
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || "Search failed"); }
      const data = await response.json() as SearchResponse;
      setJobs(data.jobs); setWarnings(data.warnings); setSources(data.sources); setSourceHealth(data.health ?? []); setHasSearched(true); setReferenceTime(Date.now()); setPage(1);
      const unseen = data.jobs.filter((job) => !seenJobIds.includes(job.id) && job.freshness === "new");
      const updatedSeen = [...new Set([...seenJobIds, ...data.jobs.map((job) => job.id)])].slice(-1500);
      setSeenJobIds(updatedSeen); safeWrite(KEYS.seen, updatedSeen);
      if (unseen.length && "Notification" in window && Notification.permission === "granted") new Notification(`VEYRA found ${unseen.length} new role${unseen.length === 1 ? "" : "s"}`, { body: unseen.slice(0, 2).map((job) => `${job.title} · ${job.company}`).join("\n") });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "VEYRA could not reach the job sources. Check your connection and try again."); }
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
    const lowered = profile.role.toLowerCase();
    setRoleCategory(lowered.includes("electrical") ? "electrical" : lowered.includes("automation") || lowered.includes("control") ? "automation" : lowered.includes("graduate") || lowered.includes("trainee") ? "get" : lowered.includes("sales") ? "sales" : lowered.includes("marketing") ? "marketing" : lowered.includes("data") ? "data" : lowered.includes("design") ? "design" : lowered.includes("finance") ? "finance" : lowered.includes("software") || lowered.includes("developer") ? "software" : "custom");
    if (primaryLocation) setLocation(primaryLocation);
    if (primaryLocation && /india|delhi|gurugram|noida|lucknow|bengaluru|bangalore|hyderabad|pune|mumbai|chennai|kolkata|patna/i.test(primaryLocation)) setScope("india");
    setWorkplace(profile.remoteOnly ? "remote" : "any");
    setFilters((current) => ({ ...current, experienceLevel: profile.experienceLevel, postedWithin: "any" }));
    setNotice("Search fields updated from your profile. Press “Search live roles” to fetch matching openings.");
    document.querySelector<HTMLFormElement>(".search-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function deleteLocalData() {
    if (!window.confirm("Delete your VEYRA profile, saved roles, application tracker, career pages and search history from this browser? This cannot be undone unless you made a backup.")) return;
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    setProfile(emptyProfile); setProfileSaved(false); setSaved([]); setApplications([]); setCareerBoards([]); setSeenJobIds([]); setSearchPresets([]); setHiddenJobIds([]); setJobs([]); setHasSearched(false); setSourceHealth([]); setWarnings([]); setNotice("All local VEYRA data was deleted from this browser.");
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
  function saveCurrentSearch() {
    const suggested = [query || roleCategory, location || (scope === "international" ? "International" : "Anywhere")].filter(Boolean).join(" · ");
    const name = window.prompt("Name this local search", suggested)?.trim(); if (!name) return;
    const preset: SearchPreset = { id: crypto.randomUUID(), name: name.slice(0, 60), query, category: roleCategory, location, scope, workplace, experienceLevel: filters.experienceLevel, qualification: filters.qualification, negativeKeywords };
    const next = [preset, ...searchPresets].slice(0, 20); if (safeWrite(KEYS.presets, next)) { setSearchPresets(next); setNotice("Search saved locally. No account or cloud sync used."); }
  }
  function applySearchPreset(preset: SearchPreset) {
    setQuery(preset.query); setRoleCategory(preset.category); setLocation(preset.location); setScope(preset.scope); setWorkplace(preset.workplace); setNegativeKeywords(preset.negativeKeywords);
    setFilters((current) => ({ ...current, experienceLevel: preset.experienceLevel, qualification: preset.qualification })); setNotice(`Loaded “${preset.name}”. Press Search live roles to refresh it.`);
  }
  function removeSearchPreset(id: string) { const next = searchPresets.filter((item) => item.id !== id); if (safeWrite(KEYS.presets, next)) setSearchPresets(next); }
  function hideJob(job: Job) { const next = [...new Set([...hiddenJobIds, job.id])].slice(-2000); if (safeWrite(KEYS.hidden, next)) { setHiddenJobIds(next); setNotice("Role hidden locally. Clear hidden roles to show it again."); } }
  function clearHiddenJobs() { if (safeWrite(KEYS.hidden, [])) { setHiddenJobIds([]); setNotice("Hidden roles are visible again."); } }

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
    const backup: LocalBackup = { version: 1, exportedAt: new Date().toISOString(), profile, saved, applications, careerBoards, seenJobIds, searchPresets, hiddenJobIds };
    download(`veyra-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), "application/json");
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as LocalBackup;
      if (data.version !== 1 || !data.profile || !Array.isArray(data.saved) || !Array.isArray(data.applications) || !Array.isArray(data.careerBoards) ||
        data.saved.some((job) => !safeHttpUrl(job.url)) || data.applications.some((record) => !safeHttpUrl(record.job.url)) || data.careerBoards.some((board) => !safeBoardUrl(board.url))) throw new Error();
      setProfile(data.profile); persistSaved(data.saved); persistApplications(data.applications); saveBoards(data.careerBoards); setSeenJobIds(data.seenJobIds ?? []); setSearchPresets(data.searchPresets ?? []); setHiddenJobIds(data.hiddenJobIds ?? []);
      safeWrite(KEYS.profile, data.profile); safeWrite(KEYS.seen, data.seenJobIds ?? []); safeWrite(KEYS.presets, data.searchPresets ?? []); safeWrite(KEYS.hidden, data.hiddenJobIds ?? []); setProfileSaved(true); setNotice("Local VEYRA backup restored.");
    } catch { setNotice("This is not a valid VEYRA backup."); }
    event.target.value = "";
  }

  return (
    <section className="workspace" id="search">
      <div className="workspace-heading"><div><p className="eyebrow">Global opportunity desk</p><h2>Search less.<br />Decide better.</h2></div><p>India and international roles across every major function, direct employer feeds, private resume matching and a local application workspace.</p></div>
      <form className="search-bar" onSubmit={search}>
        <label><span>Role family</span><select value={roleCategory} onChange={(event) => selectRoleCategory(event.target.value as RoleCategory)}><option value="custom">All / custom</option><option value="software">Software</option><option value="data">Data & AI</option><option value="electrical">Electrical</option><option value="automation">Automation & controls</option><option value="get">Graduate / apprentice</option><option value="sales">Sales & business development</option><option value="marketing">Marketing & growth</option><option value="management">Management & product</option><option value="finance">Finance & accounting</option><option value="hr">HR & recruiting</option><option value="design">Design & creative</option><option value="operations">Operations & supply chain</option><option value="support">Customer & technical support</option><option value="healthcare">Healthcare</option></select></label>
        <label><span>Role or skill</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sales, nurse, React, electrician…" maxLength={100} /></label>
        <label><span>Geography</span><select value={scope} onChange={(event) => { const next = event.target.value as GeographyScope; setScope(next); if (next === "india" && (!location || location === "Worldwide")) setLocation("India"); if (next === "international" && location === "India") setLocation(""); }}><option value="india">India</option><option value="international">Outside India</option><option value="any">Any country</option></select></label>
        <label><span>City or country</span><input list="global-places" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Delhi, London, USA, Dubai" maxLength={100} /><datalist id="global-places"><option value="India" /><option value="Delhi" /><option value="Gurugram" /><option value="Noida" /><option value="Lucknow" /><option value="Bengaluru" /><option value="Hyderabad" /><option value="Pune" /><option value="Mumbai" /><option value="London" /><option value="United States" /><option value="Canada" /><option value="Germany" /><option value="Dubai" /><option value="Singapore" /><option value="Australia" /></datalist></label>
        <label><span>Workplace</span><select value={workplace} onChange={(event) => setWorkplace(event.target.value as WorkplaceMode)}><option value="any">Onsite + hybrid + remote</option><option value="onsite">Onsite only</option><option value="hybrid">Hybrid only</option><option value="remote">Remote only</option></select></label>
        <label><span>Experience</span><select value={filters.experienceLevel} onChange={(event) => setFilters({ ...filters, experienceLevel: event.target.value as SearchFilters["experienceLevel"] })}><option value="any">Any level</option><option value="fresher">Freshers</option><option value="entry">0–2 years</option><option value="experienced">3+ years</option></select></label>
        <button className="button primary" type="submit" disabled={loading || !online}>{loading ? "Searching…" : online ? "Search live roles" : "Offline"}</button>
      </form>
      <div className="saved-searches"><button onClick={saveCurrentSearch}>＋ Save this search</button>{searchPresets.map((preset) => <span key={preset.id}><button onClick={() => applySearchPreset(preset)}>{preset.name}</button><button aria-label={`Delete ${preset.name}`} onClick={() => removeSearchPreset(preset.id)}>×</button></span>)}</div>

      <div className="desk">
        <ResumeProfile profile={profile} saved={profileSaved} onChange={changeProfile} onSave={saveProfile} onUseForSearch={useProfileForSearch} onDeleteData={deleteLocalData} />
        <div className="results-panel" aria-live="polite">
          <div className="results-tools">
            <div className="tabs">
              <button className={view === "results" ? "active" : ""} onClick={() => setView("results")}>Results <span>{filteredJobs.results.length}{filteredJobs.results.length !== jobs.length ? ` / ${jobs.length}` : ""}</span></button>
              <button className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}>Saved <span>{saved.length}</span></button>
              <button className={view === "applications" ? "active" : ""} onClick={() => setView("applications")}>Applications <span>{applications.length}</span></button>
              <button className={view === "government" ? "active" : ""} onClick={() => setView("government")}>Government</button>
              <button className={view === "sources" ? "active" : ""} onClick={() => setView("sources")}>Sources{careerBoards.length > 0 && <span>{careerBoards.length} added</span>}</button>
            </div>
            <div className="exports"><button onClick={() => exportJobs("csv")} disabled={!visibleJobs.length}>CSV ↓</button><button onClick={() => exportJobs("json")} disabled={!visibleJobs.length}>JSON ↓</button><button onClick={exportBackup}>Backup ↓</button><button onClick={() => restoreRef.current?.click()}>Restore ↑</button><input ref={restoreRef} hidden type="file" accept="application/json,.json" onChange={restoreBackup} /></div>
          </div>
          {notice && <p className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></p>}
          {!online && <p className="offline-state">You are offline. Saved roles, your profile and the application tracker still work; live search will resume when the connection returns.</p>}
          {view === "sources" && <SourceLaunchers query={query} location={location} boards={careerBoards} onBoardsChange={saveBoards} />}
          {view === "government" && <GovernmentDesk />}
          {view === "applications" && <ApplicationWorkspace records={applications} activeStatus={applicationStatus} onStatusChange={setApplicationStatus} onUpdate={updateApplication} onRemove={(id) => persistApplications(applications.filter((item) => item.id !== id))} />}
          {(view === "results" || view === "saved") && <>
            <div className="filter-bar">
              <label><span>Posted</span><select value={filters.postedWithin} onChange={(event) => setFilters({ ...filters, postedWithin: event.target.value as SearchFilters["postedWithin"] })}><option value="1">24 hours</option><option value="7">7 days</option><option value="30">30 days</option><option value="any">Any time</option></select></label>
              <label><span>Qualification</span><select value={filters.qualification} onChange={(event) => setFilters({ ...filters, qualification: event.target.value as SearchFilters["qualification"] })}><option value="any">Any</option><option value="btech">B.Tech / B.E.</option><option value="degree">Any degree</option><option value="diploma">Diploma</option><option value="iti">ITI</option></select></label>
              <label><span>Company</span><input value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })} placeholder="Company" /></label>
              <label><span>Source</span><select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value as SearchFilters["source"] })}><option value="all">All sources</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
              <label><span>Job type</span><input value={filters.employmentType} onChange={(event) => setFilters({ ...filters, employmentType: event.target.value })} placeholder="Full-time, contract" /></label>
              <label><span>Minimum salary</span><input inputMode="numeric" value={filters.minimumSalary} onChange={(event) => setFilters({ ...filters, minimumSalary: event.target.value.replace(/\D/g, "") })} placeholder="₹ per year" /></label>
              <button onClick={enableNotifications}>Enable local alerts</button>
              {filtersActive && <button className="clear-filters" onClick={() => setFilters(emptyFilters)}>Clear filters</button>}
            </div>
            <div className="search-options"><label><span>Exclude keywords</span><input value={negativeKeywords} onChange={(event) => setNegativeKeywords(event.target.value)} placeholder="senior, commission only, 5+ years" maxLength={300} /></label><p>Title matches rank first. Geography and workplace are independent, so foreign onsite, hybrid and remote searches all work.</p>{hiddenJobIds.length > 0 && <button onClick={clearHiddenJobs}>Show {hiddenJobIds.length} hidden</button>}</div>
            {sourceHealth.length > 0 && <details className="source-health"><summary>Source health · {sourceHealth.filter((item) => item.status === "healthy").length}/{sourceHealth.length} available</summary><div>{sourceHealth.map((item) => <span className={item.status} key={item.name}>{item.name}: {item.status} ({item.count})</span>)}</div></details>}
            {warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}{error && <p className="error">{error}</p>}
            {!hasSearched && view === "results" && !loading && <div className="empty-state"><span>↳</span><h3>Your shortlist starts here.</h3><p>Run a search or add company career pages under Sources.</p></div>}
            {hasSearched && view === "results" && !loading && visibleJobs.length === 0 && <div className="empty-state"><span>0</span><h3>{jobs.length ? `${jobs.length} found, but filters hid them.` : "No live matches found."}</h3><p>{jobs.length ? "Your search worked. Clear the result filters to see every role that was returned." : "Try a broader role or location, or add company career pages under Sources."}</p>{jobs.length > 0 && <button className="button primary" onClick={() => setFilters(emptyFilters)}>Show all {jobs.length} roles</button>}</div>}
            {view === "saved" && saved.length === 0 && <div className="empty-state"><span>♡</span><h3>No saved roles yet.</h3><p>Save roles from results. They stay only on this device.</p></div>}
            <div className="job-list">{paginatedJobs.map((job) => <JobCard key={job.id} job={job} saved={saved.some((item) => item.id === job.id)} tracked={applications.some((item) => item.job.id === job.id)} onSave={() => toggleSaved(job)} onTrack={() => track(job)} onHide={() => hideJob(job)} />)}</div>
            {visibleJobs.length > PAGE_SIZE && <nav className="pagination" aria-label="Results pages"><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Previous</button><span>Page {safePage} of {totalPages} · {visibleJobs.length} roles</span><button disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next →</button></nav>}
          </>}
        </div>
      </div>
    </section>
  );
}

function JobCard({ job, saved, tracked, onSave, onTrack, onHide }: { job: Job; saved: boolean; tracked: boolean; onSave: () => void; onTrack: () => void; onHide: () => void }) {
  return <article className="job-card">
    <div className="job-top"><div><p className="job-source">{job.source} · {job.workplace === "unknown" || !job.workplace ? "Workplace not stated" : job.workplace} · {job.freshness}</p><h3>{job.title}</h3><p className="company">{job.company} <span>·</span> {job.location}</p></div>{job.matchScore && <div className="score"><strong>{job.matchScore}</strong><span>fit</span></div>}</div>
    <div className="job-meta"><span>{job.experienceLevel === "any" ? "Level not stated" : job.experienceLevel}</span>{job.locationFit === "exact" && <span>Exact location</span>}{job.locationFit === "india-fallback" && <span>India result</span>}{job.locationFit === "global-remote" && <span>Worldwide remote</span>}{job.locationFit === "international" && <span>International</span>}{job.employmentType && <span>{job.employmentType}</span>}{job.salaryText && <span>{job.salaryText}</span>}{job.publishedAt && <span>{new Date(job.publishedAt).toLocaleDateString()}</span>}{job.verifiedAt && <span>Verified {new Date(job.verifiedAt).toLocaleDateString("en-IN")}</span>}</div>
    {job.matchReasons && <p className="reasons">{job.matchReasons.join(" · ")}</p>}
    {job.missingSkills && job.missingSkills.length > 0 && <p className="missing-skills">Not found in listing: {job.missingSkills.join(", ")}. Verify manually; job descriptions are incomplete.</p>}
    <p className="description">{job.description || "Open the source listing for full role details."}</p>
    <div className="tags">{job.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="job-actions"><a href={job.url} target="_blank" rel="noopener noreferrer">View original listing ↗</a><div><button onClick={onHide}>Hide</button><button onClick={onSave}>{saved ? "Remove saved" : "Save role"}</button><button onClick={onTrack}>{tracked ? "Open tracker" : "Track application"}</button></div></div>
  </article>;
}
