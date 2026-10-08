"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { RECRUITMENT_LABELS } from "@/lib/recruitment";
import type { RecruitmentType } from "@/lib/types";
import { ApplicationWorkspace } from "./application-workspace";
import { GovernmentDesk } from "./government-desk";
import { JobLinkVerifier } from "./job-link-verifier";
import { SearchFeedback } from "./search-feedback";
import type { SearchDiagnostics } from "@/lib/search-quality";
import { showLocalNotification } from "@/lib/reminders";
import { ResumeProfile } from "./resume-profile";
import { SourceLaunchers } from "./source-launchers";
import { INDIA_LOCATION_GROUPS } from "@/lib/locations";
import { matchesExperienceFilter, scoreJob } from "@/lib/matching";
import { OCCUPATION_ROLES } from "@/lib/occupations";
import type { ApplicationRecord, ApplicationStatus, CandidateProfile, CareerBoard, EmploymentSchedule, ExperienceLevel, GeographyScope, Job, LocalBackup, LocalProfile, RoleCategory, SearchFilters, SearchMode, SearchPreset, SearchResponse, SourceHealth, WorkplaceMode } from "@/lib/types";

const KEYS = { profile: "veyra.profile.v2", profiles: "veyra.profiles.v1", activeProfile: "veyra.active-profile.v1", saved: "veyra.saved-jobs.v2", applications: "veyra.applications.v1", boards: "veyra.career-boards.v1", seen: "veyra.seen-jobs.v1", presets: "veyra.search-presets.v1", hidden: "veyra.hidden-jobs.v1", recent: "veyra.recent-jobs.v1", reports: "veyra.job-reports.v1", reminderEnabled: "veyra.reminders.enabled.v1", reminderSent: "veyra.reminders.sent.v1" };
const emptyProfile: CandidateProfile = { role: "", skills: "", locations: "", experience: "", experienceLevel: "any", graduationYear: "", education: "", remoteOnly: false, recentGraduate: false };
const emptyFilters: SearchFilters = { experienceLevel: "any", postedWithin: "any", company: "", source: "all", employmentType: "", minimumSalary: "", qualification: "any", sort: "relevance", layout: "detailed" };
type View = "results" | "saved" | "applications" | "government" | "sources";
const PAGE_SIZE = 12;
const roleOptions: Array<[RoleCategory, string]> = [["custom", "All roles"], ["software", "Software"], ["data", "Data & AI"], ["electrical", "Electrical"], ["automation", "Automation & controls"], ["get", "Graduate / apprentice"], ["sales", "Sales & business development"], ["marketing", "Marketing & growth"], ["management", "Management & product"], ["finance", "Finance & accounting"], ["hr", "HR & recruiting"], ["administration", "Administration & clerical"], ["design", "Design & creative"], ["media", "Media & communications"], ["operations", "Operations & supply chain"], ["support", "Customer support"], ["healthcare", "Healthcare"], ["education", "Education"], ["science", "Science & research"], ["legal", "Legal & compliance"], ["hospitality", "Hospitality"], ["retail", "Retail"], ["construction", "Construction"], ["trades", "Skilled trades"], ["agriculture", "Agriculture & environment"], ["social", "Social impact & NGOs"]];
const workplaceOptions: Array<[WorkplaceMode, string]> = [["any", "All workplace modes"], ["onsite", "Onsite"], ["hybrid", "Hybrid"], ["remote", "Remote"]];
const experienceOptions: Array<[ExperienceLevel, string]> = [["any", "All experience levels"], ["fresher", "Student / fresher"], ["entry", "0–2 years"], ["experienced", "3+ years"]];
const scheduleOptions: Array<[EmploymentSchedule, string]> = [["any", "All job types"], ["full-time", "Full-time"], ["part-time", "Part-time"], ["internship", "Internship"], ["contract", "Contract / freelance"], ["temporary", "Temporary"], ["volunteer", "Volunteer"]];

function safeRead<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function safeWrite(key: string, value: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(value)); return localStorage.getItem(key) !== null; } catch { return false; } }
function download(name: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function salaryNumber(value: string) { const lpa = value.match(/([\d.]+)\s?(?:-|–|to)\s?[\d.]+\s?LPA/i); if (lpa) return Number(lpa[1]) * 100000; const raw = value.match(/[₹$]?[\s]?([\d,.]+)/); return raw ? Number(raw[1].replaceAll(",", "")) : 0; }
function safeHttpUrl(value: string) { try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; } }
function safeBoardUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" && ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io", "jobs.lever.co", "api.lever.co", "jobs.ashbyhq.com", "api.ashbyhq.com", "jobs.smartrecruiters.com", "api.smartrecruiters.com"].includes(url.hostname.toLowerCase()); } catch { return false; } }

export function JobWorkspace() {
  const [query, setQuery] = useState("");
  const [roleCategory, setRoleCategory] = useState<RoleCategory>("custom");
  const [selectedCategories, setSelectedCategories] = useState<RoleCategory[]>(["custom"]);
  const [location, setLocation] = useState("");
  const [scope, setScope] = useState<GeographyScope>("any");
  const [industry, setIndustry] = useState("any");
  const [workplace, setWorkplace] = useState<WorkplaceMode>("any");
  const [selectedWorkplaces, setSelectedWorkplaces] = useState<WorkplaceMode[]>(["any"]);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel[]>(["any"]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("balanced");
  const [requiredKeywords, setRequiredKeywords] = useState("");
  const [optionalKeywords, setOptionalKeywords] = useState("");
  const [recruitment, setRecruitment] = useState<"any" | RecruitmentType>("any");
  const [schedule, setSchedule] = useState<EmploymentSchedule>("any");
  const [relocation, setRelocation] = useState<"any" | "yes" | "no">("any");
  const [includeNearby, setIncludeNearby] = useState(true);
  const [negativeKeywords, setNegativeKeywords] = useState("");
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [profiles, setProfiles] = useState<LocalProfile[]>([{ id: "default", name: "General", profile: emptyProfile }]);
  const [activeProfileId, setActiveProfileId] = useState("default");
  const [profileSaved, setProfileSaved] = useState(false);
  const [saved, setSaved] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [careerBoards, setCareerBoards] = useState<CareerBoard[]>([]);
  const [seenJobIds, setSeenJobIds] = useState<string[]>([]);
  const [searchPresets, setSearchPresets] = useState<SearchPreset[]>([]);
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostics | null>(null);
  const [feedbackJob, setFeedbackJob] = useState<Job | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [referenceTime, setReferenceTime] = useState(0);
  const [fetchedAt, setFetchedAt] = useState("");
  const [cacheStatus, setCacheStatus] = useState<"hit" | "miss">("miss");
  const [newJobIds, setNewJobIds] = useState<string[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [compareJobs, setCompareJobs] = useState<Job[]>([]);
  const [view, setView] = useState<View>("results");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("saved");
  const [page, setPage] = useState(1);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const restoreRef = useRef<HTMLInputElement>(null);

  function selectRoleCategory(next: RoleCategory) {
    setRoleCategory(next);
    setSelectedCategories([next]);
    const defaults: Record<RoleCategory, string> = { software: "software engineer", electrical: "electrical engineer", automation: "automation engineer", get: "graduate trainee", sales: "sales", marketing: "marketing", management: "manager", finance: "financial analyst", hr: "human resources", administration: "administrative assistant", design: "product designer", media: "communications", data: "data analyst", operations: "operations", support: "customer support", healthcare: "healthcare", education: "teacher", science: "research", legal: "legal", hospitality: "hospitality", retail: "retail", construction: "construction", trades: "technician", agriculture: "agriculture", social: "social impact", remote: "", custom: "" };
    setQuery(defaults[next]);
    if (next === "get") setFilters((current) => ({ ...current, experienceLevel: "fresher" }));
    if (next === "remote") setWorkplace("remote");
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const storedProfile = safeRead<CandidateProfile | null>(KEYS.profile, null);
      const storedProfiles = safeRead<LocalProfile[]>(KEYS.profiles, []);
      const storedActiveId = safeRead<string>(KEYS.activeProfile, "default");
      if (storedProfiles.length) { const active = storedProfiles.find((item) => item.id === storedActiveId) ?? storedProfiles[0]; setProfiles(storedProfiles); setActiveProfileId(active.id); setProfile(active.profile); setProfileSaved(true); }
      else if (storedProfile) { const migrated = [{ id: "default", name: "General", profile: storedProfile }]; setProfiles(migrated); setProfile(storedProfile); setProfileSaved(true); safeWrite(KEYS.profiles, migrated); }
      setSaved(safeRead(KEYS.saved, []));
      setApplications(safeRead(KEYS.applications, [])); setCareerBoards(safeRead(KEYS.boards, [])); setSeenJobIds(safeRead(KEYS.seen, [])); setSearchPresets(safeRead(KEYS.presets, [])); setHiddenJobIds(safeRead(KEYS.hidden, [])); setRecentJobs(safeRead(KEYS.recent, []));
      const params = new URLSearchParams(window.location.search);
      const urlCategories = params.get("roles")?.split(",").filter(Boolean) as RoleCategory[] | undefined;
      const urlWorkplaces = params.get("workplaces")?.split(",").filter(Boolean) as WorkplaceMode[] | undefined;
      if (params.has("q")) setQuery(params.get("q") ?? "");
      if (params.has("location")) setLocation(params.get("location") ?? "");
      if (params.has("scope")) setScope(params.get("scope") as GeographyScope);
      if (params.has("industry")) setIndustry(params.get("industry") ?? "any");
      if (urlCategories?.length) { setSelectedCategories(urlCategories); setRoleCategory(urlCategories[0]); }
      if (urlWorkplaces?.length) { setSelectedWorkplaces(urlWorkplaces); setWorkplace(urlWorkplaces[0]); }
      if (params.has("experience")) { const level = params.get("experience") as ExperienceLevel; setSelectedExperience([level]); setFilters((current) => ({ ...current, experienceLevel: level })); }
      if (params.has("specificRoles")) setSelectedRoles(params.get("specificRoles")?.split(",").filter(Boolean) ?? []);
      if (params.has("mode")) setSearchMode(params.get("mode") as SearchMode);
      if (params.has("recruitment")) { const kind = params.get("recruitment"); if (kind === "any" || kind && kind in RECRUITMENT_LABELS) setRecruitment(kind as "any" | RecruitmentType); }
      if (params.has("schedule")) setSchedule(params.get("schedule") as EmploymentSchedule);
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
      const experience = selectedExperience.includes("any") || selectedExperience.some((level) => matchesExperienceFilter(level, job.experienceLevel));
      const company = !filters.company || job.company.toLowerCase().includes(filters.company.toLowerCase());
      const sourceMatch = filters.source === "all" || job.source === filters.source;
      const employment = !filters.employmentType || (job.employmentType ?? "").toLowerCase().includes(filters.employmentType.toLowerCase());
      const salary = !filters.minimumSalary || salaryNumber(job.salaryText ?? "") >= Number(filters.minimumSalary);
      const qualificationTerms: Record<SearchFilters["qualification"], readonly string[]> = { any: [], school: ["high school", "secondary school", "10th", "12th"], iti: ["iti", "industrial training institute"], diploma: ["diploma"], undergraduate: ["undergraduate", "bachelor", "degree", "graduate"], btech: ["b.tech", "btech", "b.e", "bachelor of engineering"], postgraduate: ["postgraduate", "master", "mba", "m.tech", "m.sc"], phd: ["ph.d", "phd", "doctorate"], professional: ["cfa", "cpa", "pmp", "professional certification"] };
      const selectedQualificationTerms = qualificationTerms[filters.qualification];
      const qualification = selectedQualificationTerms.length === 0 || selectedQualificationTerms.some((term) => `${job.title} ${job.description}`.toLowerCase().includes(term));
      return !hiddenJobIds.includes(job.id) && within && experience && company && sourceMatch && employment && salary && qualification;
    });
    const sort = (items: Job[]) => [...items].sort((a, b) => filters.sort === "newest" ? Date.parse(b.publishedAt || "0") - Date.parse(a.publishedAt || "0") : filters.sort === "salary" ? salaryNumber(b.salaryText ?? "") - salaryNumber(a.salaryText ?? "") : filters.sort === "company" ? a.company.localeCompare(b.company) : (b.matchScore ?? b.relevanceScore ?? 0) - (a.matchScore ?? a.relevanceScore ?? 0));
    const score = (items: Job[]) => sort(hasProfile ? items.map((job) => scoreJob(job, profile)) : items);
    return { results: score(filterList(jobs)), saved: score(filterList(saved)) };
  }, [jobs, saved, profile, filters, referenceTime, hiddenJobIds, selectedExperience]);
  const visibleJobs = view === "saved" ? filteredJobs.saved : filteredJobs.results;
  const filtersActive = !selectedExperience.includes("any") || filters.postedWithin !== "any" || Boolean(filters.company || filters.employmentType || filters.minimumSalary) || filters.source !== "all" || filters.qualification !== "any";
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedJobs = visibleJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setWarnings([]); setView("results");
    try {
      const params = new URLSearchParams({ q: query, category: roleCategory, categories: selectedCategories.join(","), roles: selectedRoles.join(","), mode: searchMode, required: requiredKeywords, optional: optionalKeywords, industry, location, scope, workplace, workplaces: selectedWorkplaces.join(","), experience: selectedExperience.length === 1 ? selectedExperience[0] : "any", qualification: filters.qualification, recruitment, schedule, relocation, nearby: String(includeNearby), negative: negativeKeywords, boards: careerBoards.map((board) => board.url).join("\n") });
      const publicParams = new URLSearchParams({ q: query, roles: selectedCategories.join(","), specificRoles: selectedRoles.join(","), mode: searchMode, industry, location, scope, workplaces: selectedWorkplaces.join(","), experience: selectedExperience.length === 1 ? selectedExperience[0] : "any", schedule, recruitment });
      window.history.replaceState(null, "", `${window.location.pathname}?${publicParams}#search`);
      const response = await fetch(`/api/jobs/search?${params}`);
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || "Search failed"); }
      const data = await response.json() as SearchResponse;
      setDiagnostics(data.diagnostics ?? null);
      setJobs(data.jobs); setWarnings(data.warnings); setSources(data.sources); setSourceHealth(data.health ?? []); setHasSearched(true); setReferenceTime(Date.now()); setFetchedAt(data.fetchedAt); setCacheStatus(data.cache?.status ?? "miss"); setPage(1);
      const unseen = data.jobs.filter((job) => !seenJobIds.includes(job.id) && job.freshness === "new");
      setNewJobIds(unseen.map((job) => job.id));
      const updatedSeen = [...new Set([...seenJobIds, ...data.jobs.map((job) => job.id)])].slice(-1500);
      setSeenJobIds(updatedSeen); safeWrite(KEYS.seen, updatedSeen);
      if (unseen.length && "Notification" in window && Notification.permission === "granted") await showLocalNotification(`VEYRA found ${unseen.length} new role${unseen.length === 1 ? "" : "s"}`, unseen.slice(0, 2).map((job) => `${job.title} · ${job.company}`).join("\n"));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "VEYRA could not reach the job sources. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  async function shareSearch() {
    try { await navigator.clipboard.writeText(window.location.href); setNotice("Shareable search link copied. It contains filters only, never your profile or resume."); }
    catch { setNotice("Copy the current browser URL to share this search. It contains no profile or resume data."); }
  }

  function toggleMulti<T extends string>(value: T, current: T[], set: (next: T[]) => void, anyValue: T) {
    if (value === anyValue) { set([anyValue]); return; }
    const withoutAny = current.filter((item) => item !== anyValue);
    const next = withoutAny.includes(value) ? withoutAny.filter((item) => item !== value) : [...withoutAny, value];
    set(next.length ? next : [anyValue]);
  }

  function openJob(job: Job) {
    const next = [job, ...recentJobs.filter((item) => item.id !== job.id)].slice(0, 20);
    setRecentJobs(next); safeWrite(KEYS.recent, next);
  }

  function toggleCompare(job: Job) {
    if (compareJobs.some((item) => item.id === job.id)) { setCompareJobs(compareJobs.filter((item) => item.id !== job.id)); return; }
    if (compareJobs.length >= 4) { setNotice("You can compare up to four jobs."); return; }
    setCompareJobs([...compareJobs, job]);
  }

  function reportJob(job: Job) {
    setFeedbackJob(job);
    requestAnimationFrame(() => document.querySelector("[data-search-feedback]")?.scrollIntoView({ behavior: "auto", block: "center" }));
  }

  function changeProfile(next: CandidateProfile) { setProfile(next); setProfileSaved(false); }
  function saveProfile() {
    const nextProfiles = profiles.map((item) => item.id === activeProfileId ? { ...item, profile } : item);
    const stored = safeWrite(KEYS.profile, profile) && safeWrite(KEYS.profiles, nextProfiles) && safeWrite(KEYS.activeProfile, activeProfileId);
    if (stored) setProfiles(nextProfiles);
    setProfileSaved(stored);
    setNotice(stored ? "Profile saved locally and verified. Use it in search when you want to update the search fields." : "This browser blocked local storage. Your profile was not saved; check privacy settings and try again.");
  }
  function switchProfile(id: string) { const next = profiles.find((item) => item.id === id); if (!next) return; setActiveProfileId(id); setProfile(next.profile); setProfileSaved(true); safeWrite(KEYS.activeProfile, id); setNotice(`Loaded local profile “${next.name}”.`); }
  function createProfile() { const name = window.prompt("Name this career profile", "New direction")?.trim(); if (!name) return; const entry: LocalProfile = { id: crypto.randomUUID(), name: name.slice(0, 40), profile: emptyProfile }; const next = [...profiles, entry].slice(0, 8); setProfiles(next); setActiveProfileId(entry.id); setProfile(emptyProfile); setProfileSaved(false); safeWrite(KEYS.profiles, next); safeWrite(KEYS.activeProfile, entry.id); }
  function deleteProfile() { if (profiles.length <= 1) return; const next = profiles.filter((item) => item.id !== activeProfileId); const replacement = next[0]; setProfiles(next); setActiveProfileId(replacement.id); setProfile(replacement.profile); setProfileSaved(true); safeWrite(KEYS.profiles, next); safeWrite(KEYS.activeProfile, replacement.id); setNotice("Local career profile deleted."); }
  function useProfileForSearch() {
    const primaryRole = profile.role.split(/[,;\n]/).map((item) => item.trim()).find(Boolean) ?? "";
    const primaryLocation = profile.locations.split(/[,;\n]/).map((item) => item.trim()).find(Boolean) ?? "";
    if (primaryRole) setQuery(primaryRole);
    const lowered = profile.role.toLowerCase();
    setRoleCategory(lowered.includes("electrical") ? "electrical" : lowered.includes("automation") || lowered.includes("control") ? "automation" : lowered.includes("graduate") || lowered.includes("trainee") ? "get" : lowered.includes("sales") ? "sales" : lowered.includes("marketing") ? "marketing" : lowered.includes("data") ? "data" : lowered.includes("design") ? "design" : lowered.includes("finance") ? "finance" : lowered.includes("software") || lowered.includes("developer") ? "software" : "custom");
    if (primaryLocation) setLocation(primaryLocation);
    if (primaryLocation && /india|delhi|gurugram|noida|lucknow|bengaluru|bangalore|hyderabad|pune|mumbai|chennai|kolkata|patna/i.test(primaryLocation)) setScope("india");
    const inferredCategory: RoleCategory = lowered.includes("electrical") ? "electrical" : lowered.includes("automation") || lowered.includes("control") ? "automation" : lowered.includes("graduate") || lowered.includes("trainee") ? "get" : lowered.includes("sales") ? "sales" : lowered.includes("marketing") ? "marketing" : lowered.includes("data") ? "data" : lowered.includes("design") ? "design" : lowered.includes("finance") ? "finance" : lowered.includes("software") || lowered.includes("developer") ? "software" : "custom";
    setSelectedCategories([inferredCategory]); setWorkplace(profile.remoteOnly ? "remote" : "any"); setSelectedWorkplaces([profile.remoteOnly ? "remote" : "any"]); setSelectedExperience([profile.experienceLevel]);
    setFilters((current) => ({ ...current, experienceLevel: profile.experienceLevel, postedWithin: "any" }));
    setNotice("Search fields updated from your profile. Press “Search live roles” to fetch matching openings.");
    document.querySelector<HTMLFormElement>(".search-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function deleteLocalData() {
    if (!window.confirm("Delete your VEYRA profile, saved roles, application tracker, career pages and search history from this browser? This cannot be undone unless you made a backup.")) return;
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    setProfile(emptyProfile); setProfiles([{ id: "default", name: "General", profile: emptyProfile }]); setActiveProfileId("default"); setProfileSaved(false); setSaved([]); setApplications([]); setCareerBoards([]); setSeenJobIds([]); setSearchPresets([]); setHiddenJobIds([]); setRecentJobs([]); setCompareJobs([]); setJobs([]); setHasSearched(false); setSourceHealth([]); setWarnings([]); setNotice("All local VEYRA data was deleted from this browser.");
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
    const preset: SearchPreset = { id: crypto.randomUUID(), name: name.slice(0, 60), query, category: roleCategory, industry, location, scope, workplace, experienceLevel: filters.experienceLevel, qualification: filters.qualification, negativeKeywords, specificRoles: selectedRoles, mode: searchMode, schedule, requiredKeywords, optionalKeywords, relocation, includeNearby };
    const next = [preset, ...searchPresets].slice(0, 20); if (safeWrite(KEYS.presets, next)) { setSearchPresets(next); setNotice("Search saved locally. No account or cloud sync used."); }
  }
  function applySearchPreset(preset: SearchPreset) {
    setQuery(preset.query); setRoleCategory(preset.category); setSelectedCategories([preset.category]); setIndustry(preset.industry ?? "any"); setLocation(preset.location); setScope(preset.scope); setWorkplace(preset.workplace); setSelectedWorkplaces([preset.workplace]); setSelectedExperience([preset.experienceLevel]); setNegativeKeywords(preset.negativeKeywords); setSelectedRoles(preset.specificRoles ?? []); setSearchMode(preset.mode ?? "balanced"); setSchedule(preset.schedule ?? "any"); setRequiredKeywords(preset.requiredKeywords ?? ""); setOptionalKeywords(preset.optionalKeywords ?? ""); setRelocation(preset.relocation ?? "any"); setIncludeNearby(preset.includeNearby ?? true);
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
    const rows = [["Title", "Company", "Location", "Remote", "Experience", "Salary", "Source", "Published", "Match", "Recruitment", "Open positions", "Application deadline", "Last checked", "URL"], ...visibleJobs.map((job) => [job.title, job.company, job.location, job.remote, job.experienceLevel, job.salaryText ?? "", job.source, job.publishedAt, job.matchScore ?? "", (job.recruitmentTypes ?? []).join("; "), job.openings ?? "Not stated", job.closesAt ?? "Not stated", job.lastCheckedAt ?? "", job.url])];
    download("veyra-jobs.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  function exportBackup() {
    const backup: LocalBackup = { version: 1, exportedAt: new Date().toISOString(), profile, profiles, activeProfileId, saved, applications, careerBoards, seenJobIds, searchPresets, hiddenJobIds };
    download(`veyra-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), "application/json");
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as LocalBackup;
      if (data.version !== 1 || !data.profile || !Array.isArray(data.saved) || !Array.isArray(data.applications) || !Array.isArray(data.careerBoards) ||
        data.saved.some((job) => !safeHttpUrl(job.url)) || data.applications.some((record) => !safeHttpUrl(record.job.url)) || data.careerBoards.some((board) => !safeBoardUrl(board.url))) throw new Error();
      const restoredProfiles = data.profiles?.length ? data.profiles : [{ id: "default", name: "General", profile: data.profile }]; const restoredActive = restoredProfiles.find((item) => item.id === data.activeProfileId) ?? restoredProfiles[0];
      setProfiles(restoredProfiles); setActiveProfileId(restoredActive.id); setProfile(restoredActive.profile); persistSaved(data.saved); persistApplications(data.applications); saveBoards(data.careerBoards); setSeenJobIds(data.seenJobIds ?? []); setSearchPresets(data.searchPresets ?? []); setHiddenJobIds(data.hiddenJobIds ?? []);
      safeWrite(KEYS.profile, restoredActive.profile); safeWrite(KEYS.profiles, restoredProfiles); safeWrite(KEYS.activeProfile, restoredActive.id); safeWrite(KEYS.seen, data.seenJobIds ?? []); safeWrite(KEYS.presets, data.searchPresets ?? []); safeWrite(KEYS.hidden, data.hiddenJobIds ?? []); setProfileSaved(true); setNotice("Local VEYRA backup restored.");
    } catch { setNotice("This is not a valid VEYRA backup."); }
    event.target.value = "";
  }

  return (
    <section className="workspace" id="search">
      <div className="workspace-heading"><div><p className="eyebrow">Global opportunity desk</p><h2>Search less.<br />Decide better.</h2></div><p>India and international roles across every major function, direct employer feeds, private resume matching and a local application workspace.</p></div>
      <form className="search-bar" onSubmit={search}>
        <MultiPicker label="Role families" values={selectedCategories} options={roleOptions} onToggle={(value) => { toggleMulti(value, selectedCategories, setSelectedCategories, "custom"); if (value !== "custom") { setRoleCategory(value); if (selectedCategories.length === 1 && selectedCategories[0] === "custom") selectRoleCategory(value); } else { setRoleCategory("custom"); setQuery(""); } }} />
        <MultiPicker label="Specific roles" values={selectedRoles} options={OCCUPATION_ROLES.filter((role) => selectedCategories.includes("custom") || selectedCategories.includes(role.category)).map((role) => [role.id, role.label])} onToggle={(value) => setSelectedRoles((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} emptyLabel="Any role in family" />
        <label><span>Role or skill</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sales, nurse, React, electrician…" maxLength={100} /></label>
        <label><span>Industry</span><select value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="any">Any industry</option><option value="technology">Technology</option><option value="manufacturing">Manufacturing</option><option value="healthcare">Healthcare & pharma</option><option value="education">Education</option><option value="finance">Finance & insurance</option><option value="retail">Retail & consumer</option><option value="construction">Construction & infrastructure</option><option value="hospitality">Hospitality & travel</option><option value="energy">Energy & utilities</option><option value="public">Government & public sector</option><option value="nonprofit">NGO & social impact</option></select></label>
        <label><span>Geography</span><select value={scope} onChange={(event) => { const next = event.target.value as GeographyScope; setScope(next); if (next === "india" && !location) setLocation("India"); if (next === "any" && location === "India") setLocation(""); }}><option value="any">Any country</option><option value="india">India</option><option value="international">Outside India</option></select></label>
        <label><span>Cities, region or country</span><input list="global-places" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Delhi NCR, Lucknow, London…" maxLength={160} /><datalist id="global-places"><option value="India" />{INDIA_LOCATION_GROUPS.map((group) => <option key={group.id} value={group.label}>{group.state}</option>)}<option value="United States" /><option value="Canada" /><option value="United Kingdom" /><option value="Europe" /><option value="United Arab Emirates" /><option value="Singapore" /><option value="Australia" /></datalist></label>
        <MultiPicker label="Workplace" values={selectedWorkplaces} options={workplaceOptions} onToggle={(value) => { toggleMulti(value, selectedWorkplaces, setSelectedWorkplaces, "any"); setWorkplace(value); }} />
        <MultiPicker label="Experience" values={selectedExperience} options={experienceOptions} onToggle={(value) => { toggleMulti(value, selectedExperience, setSelectedExperience, "any"); setFilters({ ...filters, experienceLevel: value }); }} />
        <label><span>Recruitment</span><select value={recruitment} onChange={(event) => setRecruitment(event.target.value as "any" | RecruitmentType)}><option value="any">All recruitment</option>{Object.entries(RECRUITMENT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span>Job type</span><select value={schedule} onChange={(event) => setSchedule(event.target.value as EmploymentSchedule)}>{scheduleOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span>Search precision</span><select value={searchMode} onChange={(event) => setSearchMode(event.target.value as SearchMode)}><option value="exact">Exact titles</option><option value="balanced">Balanced</option><option value="broad">Broader discovery</option></select></label>
        <label className="inline-check"><input type="checkbox" checked={includeNearby} onChange={(event) => setIncludeNearby(event.target.checked)} /><span>Include nearby cities</span></label>
        <button className="button primary" type="submit" disabled={loading || !online}>{loading ? "Searching…" : online ? "Search live roles" : "Offline"}</button>
      </form>
      <div className="saved-searches"><button onClick={saveCurrentSearch}>＋ Save this search</button><button onClick={shareSearch}>↗ Copy search link</button>{searchPresets.map((preset) => <span key={preset.id}><button onClick={() => applySearchPreset(preset)}>{preset.name}</button><button aria-label={`Delete ${preset.name}`} onClick={() => removeSearchPreset(preset.id)}>×</button></span>)}</div>

      <div className="desk">
        <ResumeProfile profile={profile} profiles={profiles} activeProfileId={activeProfileId} saved={profileSaved} onChange={changeProfile} onSave={saveProfile} onUseForSearch={useProfileForSearch} onDeleteData={deleteLocalData} onSwitchProfile={switchProfile} onCreateProfile={createProfile} onDeleteProfile={deleteProfile} />
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
              <label><span>Qualification</span><select value={filters.qualification} onChange={(event) => setFilters({ ...filters, qualification: event.target.value as SearchFilters["qualification"] })}><option value="any">Any</option><option value="school">School / 10th / 12th</option><option value="iti">ITI</option><option value="diploma">Diploma</option><option value="undergraduate">Undergraduate / degree</option><option value="btech">B.Tech / B.E.</option><option value="postgraduate">Postgraduate</option><option value="phd">PhD / doctorate</option><option value="professional">Professional certification</option></select></label>
              <label><span>Company</span><input value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })} placeholder="Company" /></label>
              <label><span>Source</span><select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value as SearchFilters["source"] })}><option value="all">All sources</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
              <label><span>Job type</span><input value={filters.employmentType} onChange={(event) => setFilters({ ...filters, employmentType: event.target.value })} placeholder="Full-time, contract" /></label>
              <label><span>Minimum salary</span><input inputMode="numeric" value={filters.minimumSalary} onChange={(event) => setFilters({ ...filters, minimumSalary: event.target.value.replace(/\D/g, "") })} placeholder="₹ per year" /></label>
              <label><span>Sort</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value as SearchFilters["sort"] })}><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="salary">Salary</option><option value="company">Company</option></select></label>
              <label><span>Layout</span><select value={filters.layout} onChange={(event) => setFilters({ ...filters, layout: event.target.value as SearchFilters["layout"] })}><option value="detailed">Detailed</option><option value="compact">Compact</option></select></label>
              <button onClick={enableNotifications}>Enable local alerts</button>
              {filtersActive && <button className="clear-filters" onClick={() => { setFilters(emptyFilters); setSelectedExperience(["any"]); }}>Clear filters</button>}
            </div>
            <div className="search-options relevance-controls"><label><span>Required keywords</span><input value={requiredKeywords} onChange={(event) => setRequiredKeywords(event.target.value)} placeholder="Excel, Hindi, B.Ed" maxLength={300} /></label><label><span>Helpful keywords</span><input value={optionalKeywords} onChange={(event) => setOptionalKeywords(event.target.value)} placeholder="remote, training, stipend" maxLength={300} /></label><label><span>Exclude keywords</span><input value={negativeKeywords} onChange={(event) => setNegativeKeywords(event.target.value)} placeholder="senior, commission only, 5+ years" maxLength={300} /></label><label><span>Relocation</span><select value={relocation} onChange={(event) => setRelocation(event.target.value as "any" | "yes" | "no")}><option value="any">Any / not stated</option><option value="yes">Relocation offered</option><option value="no">No relocation</option></select></label><p>Exact mode requires a selected title in the job title. Balanced mode prioritises titles. Broad mode can match descriptions.</p>{hiddenJobIds.length > 0 && <button onClick={clearHiddenJobs}>Show {hiddenJobIds.length} hidden</button>}</div>
            {sourceHealth.length > 0 && <details className="source-health"><summary>Source health · {sourceHealth.filter((item) => item.status === "healthy").length}/{sourceHealth.length} available · checked {fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : "now"} · cache {cacheStatus}</summary><div>{sourceHealth.map((item) => <span className={item.status} key={item.name}>{item.name}: {item.status} ({item.count}){item.cached ? " · cached" : ""}</span>)}</div></details>}
            {diagnostics && <details className="source-health"><summary>Search coverage and filter diagnostics</summary><p>{diagnostics.gathered} candidates checked · {diagnostics.duplicatesRemoved} duplicates removed · {diagnostics.returned} matches · {diagnostics.employersSearched}/{diagnostics.employersAvailable} employer feeds searched.</p><p>First failing filter counts; a job is counted once.</p><ul>{Object.entries(diagnostics.removedBy).map(([reason, count]) => <li key={reason}>{reason}: {count}</li>)}</ul></details>}
            {hasSearched && <SearchFeedback key={feedbackJob?.id ?? "search"} job={feedbackJob} onClose={feedbackJob ? () => setFeedbackJob(null) : undefined} />}
            {compareJobs.length > 0 && <CompareTray jobs={compareJobs} onRemove={(id) => setCompareJobs(compareJobs.filter((job) => job.id !== id))} />}
            {warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}{error && <p className="error">{error}</p>}
            {!hasSearched && view === "results" && !loading && <div className="empty-state"><span>↳</span><h3>Your shortlist starts here.</h3><p>Run a search or add company career pages under Sources.</p></div>}
            {hasSearched && view === "results" && !loading && visibleJobs.length === 0 && <div className="empty-state"><span>0</span><h3>{jobs.length ? `${jobs.length} found, but result filters hid them.` : "No live matches found."}</h3><p>{jobs.length ? "Company, source, posting date, job type, salary, qualification, experience or hidden-listing filters excluded these results." : "The checked feeds did not contain a vacancy satisfying these rules. This does not mean no jobs exist elsewhere."}</p><div className="recovery-actions">
              {jobs.length > 0 && <button onClick={() => { setFilters(emptyFilters); setSelectedExperience(["any"]); }}>Clear result filters</button>}
              {location && !includeNearby && <button onClick={() => { setIncludeNearby(true); setNotice("Nearby cities enabled. Run Search to check this wider area."); }}>Include nearby cities</button>}
              {location && <button onClick={() => { setLocation(""); setNotice("City filter cleared; your India/global scope is preserved. Run Search again."); }}>Search across selected region</button>}
              {searchMode !== "broad" && <button onClick={() => { setSearchMode("broad"); setSelectedRoles([]); setNotice("Broader role discovery selected. Your region and fresher safety remain. Run Search again."); }}>Discover related titles</button>}
              {!selectedExperience.includes("any") && <button onClick={() => { setSelectedExperience(["any"]); setFilters({ ...filters, experienceLevel: "any" }); setNotice("All experience levels selected. Senior jobs may now appear. Run Search again."); }}>Include all experience levels</button>}
              {requiredKeywords && <button onClick={() => { setRequiredKeywords(""); setNotice("Required keyword rules cleared. Run Search again."); }}>Remove required keywords</button>}
              {schedule !== "any" && <button onClick={() => { setSchedule("any"); setNotice("All job types selected. Run Search again."); }}>Include all job types</button>}
            </div><p>Press Search after choosing a change to fetch updated matches.</p></div>}

            {view === "saved" && saved.length === 0 && <div className="empty-state"><span>♡</span><h3>No saved roles yet.</h3><p>Save roles from results. They stay only on this device.</p></div>}
            <div className={`job-list ${filters.layout}`}>{paginatedJobs.map((job) => <JobCard key={job.id} job={job} isNew={newJobIds.includes(job.id)} compared={compareJobs.some((item) => item.id === job.id)} saved={saved.some((item) => item.id === job.id)} tracked={applications.some((item) => item.job.id === job.id)} onSave={() => toggleSaved(job)} onTrack={() => track(job)} onHide={() => hideJob(job)} onOpen={() => openJob(job)} onCompare={() => toggleCompare(job)} onReport={() => reportJob(job)} />)}</div>
            {recentJobs.length > 0 && view === "results" && <details className="recent-jobs"><summary>Recently viewed on this device ({recentJobs.length})</summary><div>{recentJobs.slice(0, 6).map((job) => <a key={job.id} href={job.url} target="_blank" rel="noopener noreferrer">{job.title} · {job.company}</a>)}</div></details>}
            {view === "results" && <JobLinkVerifier />}
            {visibleJobs.length > PAGE_SIZE && <nav className="pagination" aria-label="Results pages"><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Previous</button><span>Page {safePage} of {totalPages} · {visibleJobs.length} roles</span><button disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next →</button></nav>}
          </>}
        </div>
      </div>
    </section>
  );
}

function MultiPicker<T extends string>({ label, values, options, onToggle, emptyLabel = "None" }: { label: string; values: T[]; options: Array<[T, string]>; onToggle: (value: T) => void; emptyLabel?: string }) {
  const selectedLabels = options.filter(([value]) => values.includes(value)).map(([, name]) => name);
  return <details className="multi-picker"><summary><span>{label}</span><strong>{selectedLabels.join(", ") || emptyLabel}</strong></summary><div>{options.map(([value, name]) => <label key={value}><input type="checkbox" checked={values.includes(value)} onChange={() => onToggle(value)} /><span>{name}</span></label>)}</div></details>;
}

function CompareTray({ jobs, onRemove }: { jobs: Job[]; onRemove: (id: string) => void }) {
  return <section className="compare-tray" aria-label="Job comparison"><div className="compare-head"><strong>Compare jobs</strong><span>{jobs.length}/4</span></div><div className="compare-table">{jobs.map((job) => <article key={job.id}><button aria-label={`Remove ${job.title} from comparison`} onClick={() => onRemove(job.id)}>×</button><h4>{job.title}</h4><p>{job.company}</p><dl><div><dt>Location</dt><dd>{job.location || "Not stated"}</dd></div><div><dt>Workplace</dt><dd>{job.workplace === "unknown" ? "Not stated" : job.workplace}</dd></div><div><dt>Experience</dt><dd>{job.experienceRange ?? "Not stated"}</dd></div><div><dt>Visa</dt><dd>{job.visaSponsorship === "not-stated" ? "Not stated" : job.visaSponsorship}</dd></div><div><dt>Salary</dt><dd>{job.salaryText ?? "Not stated"}</dd></div></dl></article>)}</div></section>;
}

function JobCard({ job, saved, tracked, isNew, compared, onSave, onTrack, onHide, onOpen, onCompare, onReport }: { job: Job; saved: boolean; tracked: boolean; isNew: boolean; compared: boolean; onSave: () => void; onTrack: () => void; onHide: () => void; onOpen: () => void; onCompare: () => void; onReport: () => void }) {
  return <article className="job-card">
    <div className="job-top"><div><p className="job-source">{isNew && <b>New since last search · </b>}{job.source} · {job.workplace === "unknown" || !job.workplace ? "Workplace not stated" : job.workplace} · {job.freshness}</p><h3>{job.title}</h3><p className="company">{job.company} <span>·</span> {job.location || "Location not stated"}</p></div>{job.matchScore && <div className="score"><strong>{job.matchScore}</strong><span>fit</span></div>}</div>
    <div className="job-meta"><span>Status: {job.liveStatus === "live" ? "Live in source feed" : job.liveStatus === "closed" ? "Closed" : "Not confirmed"}</span><span>Country: {job.country ?? "Not stated"}</span><span>City: {job.city ?? "Not stated"}</span><span>Experience: {job.experienceRange ?? "Not stated"}</span><span>Qualification: {job.qualification ?? "Not stated"}</span><span>Remote: {job.remoteScope === "not-stated" || !job.remoteScope ? "Not stated" : job.remoteScope}</span><span>Visa: {job.visaSponsorship === "not-stated" || !job.visaSponsorship ? "Not stated" : job.visaSponsorship}</span><span>Work authorisation: {job.workAuthorization ?? "Not stated"}</span><span>Language: {job.requiredLanguage ?? "Not stated"}</span><span>Relocation: {job.relocation === "not-stated" || !job.relocation ? "Not stated" : job.relocation}</span>{job.employmentType && <span>{job.employmentType}</span>}<span>Open positions: {job.openings ?? "Not stated"}</span><span>Application deadline: {job.closesAt ? new Date(job.closesAt).toLocaleString() : "Not stated"}</span>{(job.recruitmentTypes ?? []).map((kind) => <span key={kind}>{RECRUITMENT_LABELS[kind]}</span>)}<span>Salary: {job.salaryText ?? "Not stated"}{job.salaryCurrency && job.salaryCurrency !== "Not stated" ? ` · ${job.salaryCurrency}` : ""}</span>{job.publishedAt && <span>Posted: {new Date(job.publishedAt).toLocaleDateString()}</span>}<span>Checked: {job.lastCheckedAt ? new Date(job.lastCheckedAt).toLocaleString() : "Not stated"}</span></div>
    {job.matchReasons && <p className="reasons">{job.matchReasons.join(" · ")}</p>}
    {job.missingSkills && job.missingSkills.length > 0 && <p className="missing-skills">Not found in listing: {job.missingSkills.join(", ")}. Verify manually; job descriptions are incomplete.</p>}
    <p className="description">{job.description || "Open the source listing for full role details."}</p>
    <div className="tags">{job.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="job-actions"><a href={job.url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>View original listing ↗</a><div><button onClick={onCompare}>{compared ? "Remove compare" : "Compare"}</button><button onClick={onReport}>Report</button><button onClick={onHide}>Hide</button><button onClick={onSave}>{saved ? "Remove saved" : "Save role"}</button><button onClick={onTrack}>{tracked ? "Open tracker" : "Track application"}</button></div></div>
  </article>;
}
