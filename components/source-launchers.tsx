"use client";

import { FormEvent, useState } from "react";
import type { CareerBoard } from "@/lib/types";

const privateSources = [
  ["LinkedIn", (q: string, l: string) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`],
  ["Indeed", (q: string, l: string) => `https://in.indeed.com/jobs?q=${q}&l=${l}`],
  ["Naukri", (q: string, l: string) => `https://www.naukri.com/jobs-in-india?k=${q}&l=${l}`],
  ["Foundit", (q: string, l: string) => `https://www.foundit.in/srp/results?query=${q}&locations=${l}`],
  ["Wellfound", () => "https://wellfound.com/jobs"],
  ["Internshala", () => "https://internshala.com/jobs/"],
] as const;

const governmentSources = [
  ["National Career Service", "https://www.ncs.gov.in/"],
  ["UPSC", "https://www.upsc.gov.in/recruitment/recruitment-advertisement"],
  ["SSC", "https://ssc.gov.in/"],
  ["BPSC", "https://bpsc.bihar.gov.in/"],
  ["IBPS Banking", "https://www.ibps.in/"],
  ["Employment News", "https://employmentnews.gov.in/"],
  ["Indian Railways", "https://indianrailways.gov.in/"],
  ["Government vacancy directory", "https://www.ncs.gov.in/pages/govt-job-vacancies.aspx"]
] as const;

const curatedCareerPages = [
  ["Indian product & software", [
    ["PhonePe", "https://www.phonepe.com/careers/"], ["Razorpay", "https://razorpay.com/jobs/"], ["Zoho", "https://careers.zohocorp.com/"], ["Freshworks", "https://www.freshworks.com/company/careers/"], ["Acceldata", "https://jobs.lever.co/acceldata"]
  ]],
  ["Electrical & automation", [
    ["Hitachi Energy", "https://careers.hitachi.com/"], ["Siemens Energy", "https://jobs.siemens-energy.com/"], ["Schneider Electric", "https://www.se.com/in/en/about-us/careers/"], ["Rockwell Automation", "https://www.rockwellautomation.com/en-us/company/careers.html"], ["ABB", "https://careers.abb/global/en/home"]
  ]],
  ["Graduate & core engineering", [
    ["Wipro", "https://careers.wipro.com/"], ["Daikin India", "https://career.daikinindia.com/"], ["POWERGRID", "https://www.powergrid.in/en/job-opportunities"], ["NTPC", "https://careers.ntpc.co.in/"], ["ISRO", "https://www.isro.gov.in/CurrentOpportunities.html"]
  ]],
  ["Remote-first", [
    ["Smart Working", "https://jobs.lever.co/smart-working-solutions"], ["ElevenLabs", "https://jobs.ashbyhq.com/elevenlabs"], ["Weave", "https://jobs.ashbyhq.com/weave"], ["Emergence", "https://jobs.ashbyhq.com/emergence"]
  ]]
] as const;

type Props = { query: string; location: string; boards: CareerBoard[]; onBoardsChange: (boards: CareerBoard[]) => void };

export function SourceLaunchers({ query, location, boards, onBoardsChange }: Props) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  function addBoard(event: FormEvent) {
    event.preventDefault();
    try {
      const parsed = new URL(url);
      const allowed = ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io", "jobs.lever.co", "api.lever.co", "jobs.ashbyhq.com", "api.ashbyhq.com"];
      if (!allowed.includes(parsed.hostname.toLowerCase())) throw new Error();
      if (boards.some((board) => board.url === parsed.toString())) { setMessage("This career page is already included."); return; }
      onBoardsChange([...boards, { id: crypto.randomUUID(), url: parsed.toString(), label: parsed.pathname.split("/").filter(Boolean).at(-1) ?? parsed.hostname }]);
      setUrl(""); setMessage("Career page added. Run the search again.");
    } catch { setMessage("Use a public Greenhouse, Lever or Ashby careers URL."); }
  }

  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location || "India");
  return (
    <div className="sources-view">
      <section className="source-section">
        <p className="eyebrow">Direct company feeds</p>
        <h3>Add a company careers page</h3>
        <p>Paste a public Greenhouse, Lever or Ashby job-board URL. VEYRA reads its official public feed without scraping or credentials.</p>
        <form className="board-form" onSubmit={addBoard}><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://jobs.ashbyhq.com/company" /><button className="button primary" type="submit">Add source</button></form>
        {message && <p className="local-status">{message}</p>}
        <div className="board-list">
          {boards.length === 0 && <p>No company career pages added yet.</p>}
          {boards.map((board) => <div key={board.id}><a href={board.url} target="_blank" rel="noopener noreferrer">{board.label} ↗</a><button onClick={() => onBoardsChange(boards.filter((item) => item.id !== board.id))}>Remove</button></div>)}
        </div>
      </section>
      <section className="source-section">
        <p className="eyebrow">Curated coverage</p><h3>Official company career pages</h3>
        <p>These are direct employer pages grouped by the roles VEYRA is designed to cover. ATS-compatible companies are searched automatically when the matching role family is selected.</p>
        <div className="career-groups">{curatedCareerPages.map(([group, links]) => <div key={group}><h4>{group}</h4>{links.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name} <span>↗</span></a>)}</div>)}</div>
      </section>
      <section className="source-section">
        <p className="eyebrow">Safe search launchers</p><h3>Major job platforms</h3>
        <p>VEYRA does not scrape these services. These links open your current role and location search on the original platform.</p>
        <div className="launcher-list">{privateSources.map(([name, builder]) => <a key={name} href={builder(encodedQuery, encodedLocation)} target="_blank" rel="noopener noreferrer"><span>{name}</span><b>Search ↗</b></a>)}</div>
      </section>
      <section className="source-section government">
        <p className="eyebrow">Official sources only</p><h3>Government openings</h3>
        <p>Openings, notifications and eligibility must be verified on the issuing government website before applying.</p>
        <div className="launcher-list">{governmentSources.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"><span>{name}</span><b>Open portal ↗</b></a>)}</div>
      </section>
    </div>
  );
}
