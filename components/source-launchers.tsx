"use client";

import { FormEvent, useState } from "react";
import { employerRegistry, publicBoardUrl } from "@/lib/employers";
import { employerDirectory } from "@/lib/employer-directory";
import type { CareerBoard } from "@/lib/types";

const portalSources = [
  { name: "LinkedIn", coverage: "Global", note: "Network, company and experience filters", build: (q: string, l: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
  { name: "Indeed", coverage: "Global", note: "Broad coverage, salary and date filters", build: (q: string, l: string) => `https://in.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
  { name: "Naukri", coverage: "India", note: "Indian employers and experience filters", build: (q: string, l: string) => `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
  { name: "Foundit", coverage: "India + APAC", note: "Role, location and experience discovery", build: (q: string, l: string) => `https://www.foundit.in/srp/results?query=${encodeURIComponent(q)}&locations=${encodeURIComponent(l)}` },
  { name: "Internshala", coverage: "India", note: "Internships and early-career roles", build: (q: string) => `https://internshala.com/jobs/keywords-${encodeURIComponent(q.replaceAll(" ", "-"))}/` },
  { name: "Wellfound", coverage: "Startups", note: "Startup roles, salary and equity visibility", build: () => "https://wellfound.com/jobs" },
  { name: "Glassdoor", coverage: "Global", note: "Jobs plus company and salary research", build: (q: string) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}` },
  { name: "ZipRecruiter", coverage: "United States", note: "US job discovery and alerts", build: (q: string, l: string) => `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
  { name: "Dice", coverage: "United States tech", note: "Technology-focused roles", build: (q: string, l: string) => `https://www.dice.com/jobs?q=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
  { name: "SEEK", coverage: "Australia + NZ", note: "Regional jobs and classification filters", build: (q: string) => `https://www.seek.com.au/${encodeURIComponent(q.replaceAll(" ", "-"))}-jobs` },
  { name: "Reed", coverage: "United Kingdom", note: "UK roles, salary and sector filters", build: (q: string) => `https://www.reed.co.uk/jobs/${encodeURIComponent(q.replaceAll(" ", "-"))}-jobs` },
  { name: "StepStone", coverage: "Europe", note: "European employers and role discovery", build: (q: string) => `https://www.stepstone.de/jobs/${encodeURIComponent(q.replaceAll(" ", "-"))}` },
  { name: "EURES", coverage: "European Union", note: "Official European employment network", build: () => "https://eures.europa.eu/jobseekers_en" },
  { name: "USAJOBS", coverage: "United States government", note: "Official US federal employment portal", build: (q: string, l: string) => `https://www.usajobs.gov/Search/Results?k=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
  { name: "NHS Jobs", coverage: "United Kingdom healthcare", note: "Official NHS clinical and non-clinical roles", build: (q: string) => `https://www.jobs.nhs.uk/candidate/search/results?keyword=${encodeURIComponent(q)}` },
  { name: "Bayt", coverage: "Middle East", note: "UAE and wider MENA opportunities", build: (q: string) => `https://www.bayt.com/en/international/jobs/${encodeURIComponent(q.replaceAll(" ", "-"))}-jobs/` },
  { name: "GulfTalent", coverage: "Gulf region", note: "Professional jobs across UAE and GCC markets", build: () => "https://www.gulftalent.com/jobs" },
  { name: "JobStreet", coverage: "Southeast Asia", note: "Singapore, Malaysia, Philippines and regional roles", build: () => "https://www.jobstreet.com/" },
  { name: "Handshake", coverage: "Students and graduates", note: "College careers and early-career opportunities", build: () => "https://joinhandshake.com/students/" },
  { name: "TimesJobs", coverage: "India", note: "Cross-sector Indian job discovery", build: (q: string) => `https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=${encodeURIComponent(q)}` },
  { name: "Google Jobs", coverage: "Global discovery", note: "Cross-site discovery in a new search", build: (q: string, l: string) => `https://www.google.com/search?q=${encodeURIComponent(`${q} jobs ${l}`)}` }
] as const;

const governmentSources = [
  ["National Career Service", "https://www.ncs.gov.in/"], ["UPSC", "https://www.upsc.gov.in/recruitment/recruitment-advertisement"], ["SSC", "https://ssc.gov.in/"], ["BPSC", "https://bpsc.bihar.gov.in/"],
  ["IBPS Banking", "https://www.ibps.in/"], ["Employment News", "https://employmentnews.gov.in/"], ["Indian Railways", "https://indianrailways.gov.in/"], ["Government vacancy directory", "https://www.ncs.gov.in/pages/govt-job-vacancies.aspx"],
  ["IOCL", "https://iocl.com/latest-job-opening"], ["ONGC", "https://ongcindia.com/web/eng/career/recruitment-notice"], ["NTPC", "https://careers.ntpc.co.in/"], ["BHEL", "https://careers.bhel.in/"], ["SAIL", "https://sailcareers.com/"], ["ISRO", "https://www.isro.gov.in/Careers.html"], ["DRDO", "https://www.drdo.gov.in/drdo/careers"], ["GATE", "https://gate2027.iitm.ac.in/"], ["NTA examinations", "https://exams.nta.ac.in/"]
] as const;

const builtFeatures = [
  ["One search model", "Role, geography, workplace, experience, qualification and negative keywords work together."],
  ["Official feeds", "Public employer ATS feeds are read directly; restricted job portals are never scraped."],
  ["Local shortlist", "Saved searches, jobs, notes and application stages remain in this browser."],
  ["Quality controls", "Duplicate removal, freshness, title-first relevance, source health and closed-date checks."],
  ["Portable workflow", "CSV/JSON export and complete local backup avoid lock-in."],
  ["Original applications", "Every application opens the employer or platform page so eligibility can be verified."]
] as const;

type Props = { query: string; location: string; boards: CareerBoard[]; onBoardsChange: (boards: CareerBoard[]) => void };

export function SourceLaunchers({ query, location, boards, onBoardsChange }: Props) {
  const [url, setUrl] = useState(""); const [message, setMessage] = useState("");

  function addBoard(event: FormEvent) {
    event.preventDefault();
    try {
      const parsed = new URL(url); const allowed = ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io", "jobs.lever.co", "api.lever.co", "jobs.ashbyhq.com", "api.ashbyhq.com", "jobs.smartrecruiters.com", "api.smartrecruiters.com"];
      if (parsed.protocol !== "https:" || !allowed.includes(parsed.hostname.toLowerCase())) throw new Error();
      if (boards.some((board) => board.url === parsed.toString())) { setMessage("This career page is already included."); return; }
      onBoardsChange([...boards, { id: crypto.randomUUID(), url: parsed.toString(), label: parsed.pathname.split("/").filter(Boolean).at(-1) ?? parsed.hostname }]); setUrl(""); setMessage("Career page added. Run the search again.");
    } catch { setMessage("Use a public Greenhouse, Lever, Ashby or SmartRecruiters careers URL."); }
  }

  return <div className="sources-view">
    <section className="source-section">
      <p className="eyebrow">Direct company feeds</p><h3>Add a company careers page</h3>
      <p>Paste a public Greenhouse, Lever, Ashby or SmartRecruiters job-board URL. VEYRA reads the official public feed without credentials or page scraping.</p>
      <form className="board-form" onSubmit={addBoard}><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://jobs.smartrecruiters.com/company" /><button className="button primary" type="submit">Add source</button></form>
      {message && <p className="local-status">{message}</p>}
      <div className="board-list">{boards.length === 0 && <p>No personal company career pages added yet.</p>}{boards.map((board) => <div key={board.id}><a href={board.url} target="_blank" rel="noopener noreferrer">{board.label} ↗</a><button onClick={() => onBoardsChange(boards.filter((item) => item.id !== board.id))}>Remove</button></div>)}</div>
    </section>
    <section className="source-section">
      <p className="eyebrow">Public source coverage</p><h3>{employerRegistry.length} live feeds · {employerDirectory.length} official employer sources</h3>
      <p>Live ATS feeds are searched automatically. The wider directory opens each employer’s official careers site without scraping it. Feed failures are isolated, cached and temporarily disabled after repeated errors.</p>
      <div className="employer-cloud">{employerRegistry.map((employer) => <a key={`${employer.provider}-${employer.slug}`} href={publicBoardUrl(employer)} target="_blank" rel="noopener noreferrer"><strong>{employer.name}</strong><span>{employer.provider} · {employer.regions.join(" + ")}</span></a>)}</div>
      <details className="official-directory"><summary>Browse {employerDirectory.length} official employer career sites</summary><div className="employer-cloud">{employerDirectory.map((employer) => <a key={employer.name} href={employer.careersUrl} target="_blank" rel="noopener noreferrer"><strong>{employer.name}</strong><span>{employer.regions.join(" + ")} · {employer.industries.slice(0, 2).join(" + ")}</span></a>)}</div></details>
      <p className="registry-contribute">Missing an employer? <a href="https://github.com/i-akb25/VEYRA/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Submit an official source through GitHub ↗</a></p>
    </section>
    <section className="source-section">
      <p className="eyebrow">Unified workspace</p><h3>What VEYRA replaces</h3>
      <p>These are the useful cross-portal patterns VEYRA can provide safely without pretending to be the platforms themselves.</p>
      <div className="feature-grid">{builtFeatures.map(([name, note]) => <div key={name}><strong>{name}</strong><p>{note}</p></div>)}</div>
    </section>
    <section className="source-section">
      <p className="eyebrow">Safe search launchers</p><h3>Major India and international portals</h3>
      <p>For platforms without a suitable public job API, VEYRA opens the current role and location on the original site. Sign-in, alerts and applications remain under your control there.</p>
      <div className="portal-grid">{portalSources.map((portal) => <a key={portal.name} href={portal.build(query || "jobs", location || "Worldwide")} target="_blank" rel="noopener noreferrer"><span><strong>{portal.name}</strong><small>{portal.coverage}</small></span><p>{portal.note}</p><b>Search ↗</b></a>)}</div>
    </section>
    <section className="source-section government">
      <p className="eyebrow">Official sources only</p><h3>Government openings</h3><p>Openings, notifications and eligibility must be verified on the issuing government website before applying.</p>
      <div className="launcher-list">{governmentSources.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"><span>{name}</span><b>Open portal ↗</b></a>)}</div>
    </section>
  </div>;
}
