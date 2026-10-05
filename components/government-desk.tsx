"use client";

import { useMemo, useState } from "react";
import { GOVERNMENT_OPPORTUNITIES } from "@/lib/government";
import type { GovernmentCategory, Qualification } from "@/lib/types";

const categories: Array<"All" | GovernmentCategory> = ["All", "UPSC", "SSC", "BPSC", "State PSC", "Banking", "Railway", "Defence", "Teaching", "PSU", "Apprenticeship", "Higher Studies", "Private Exam"];

export function GovernmentDesk() {
  const [category, setCategory] = useState<"All" | GovernmentCategory>("All");
  const [includeRecent, setIncludeRecent] = useState(false);
  const [qualification, setQualification] = useState<Qualification>("any");
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());
  const records = useMemo(() => GOVERNMENT_OPPORTUNITIES.filter((item) => {
    const text = `${item.title} ${item.organization} ${item.qualification} ${item.location}`.toLowerCase();
    const qualificationMatch = qualification === "any" || item.qualificationLevel === qualification || item.qualificationLevel === "any";
    return (category === "All" || item.category === category) && qualificationMatch && (!query || text.includes(query.toLowerCase())) && (includeRecent || item.deadline === null || Date.parse(item.deadline) >= now);
  }).sort((a, b) => (a.deadline ? Date.parse(a.deadline) : Number.MAX_SAFE_INTEGER) - (b.deadline ? Date.parse(b.deadline) : Number.MAX_SAFE_INTEGER)), [category, qualification, query, includeRecent, now]);

  return <div className="government-desk">
    <div className="government-head">
      <div><p className="eyebrow">Official notices, exams and study routes</p><h3>Public opportunity desk</h3><p>Government recruitment, PSUs, apprenticeships, major examinations and higher-study routes are linked only to official issuing authorities. Private assessments are clearly labelled. Always verify eligibility, corrigenda, fees and deadlines at the source.</p></div>
      <label className="check-label"><input type="checkbox" checked={includeRecent} onChange={(event) => setIncludeRecent(event.target.checked)} /><span>Show recent/closed notices</span></label>
    </div>
    <div className="government-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="government-filters"><label><span>Search notices</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Organisation, post or state" /></label><label><span>Qualification</span><select value={qualification} onChange={(event) => setQualification(event.target.value as Qualification)}><option value="any">Any qualification</option><option value="school">10th / 12th</option><option value="iti">ITI</option><option value="diploma">Diploma</option><option value="undergraduate">Graduate</option><option value="btech">B.Tech / B.E.</option><option value="postgraduate">Postgraduate</option><option value="phd">PhD</option><option value="professional">Professional</option></select></label></div>
    {records.length === 0 && <div className="empty-state compact"><span>○</span><h3>No verified open notice here.</h3><p>Enable recent notices or open the official portal under Sources. VEYRA will not display an unverified vacancy just to fill this page.</p></div>}
    <div className="government-list">{records.map((item) => {
      const closed = item.deadline !== null && Date.parse(item.deadline) < now;
      return <article className="government-card" key={item.id}>
        <div className="government-card-head"><div><p>{item.category} · {item.organization}</p><h4>{item.title}</h4></div><span className={closed ? "closed" : "open"}>{closed ? "Closed / recent" : item.deadline ? "Open" : "Verify window"}</span></div>
        <dl><div><dt>Notification</dt><dd>{new Date(item.notificationDate).toLocaleDateString("en-IN")}</dd></div><div><dt>Deadline</dt><dd>{item.deadline ? new Date(item.deadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Varies by notice; verify officially"}</dd></div><div><dt>Vacancies</dt><dd>{item.vacancies ?? "Not stated"}</dd></div><div><dt>Age limit</dt><dd>{item.ageLimit ?? "Not stated"}</dd></div><div><dt>Location</dt><dd>{item.location}</dd></div><div><dt>Qualification</dt><dd>{item.qualification}</dd></div><div><dt>Last verified</dt><dd>{item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString("en-IN") : "Not stated"}</dd></div></dl>
        {item.note && <p className="government-note">{item.note}</p>}
        <div className="official-actions"><a href={item.officialUrl} target="_blank" rel="noopener noreferrer">Open official notice ↗</a>{item.officialPdfUrl && <a href={item.officialPdfUrl} target="_blank" rel="noopener noreferrer">Official PDF ↗</a>}</div>
        {item.corrections && item.corrections.length > 0 && <details><summary>Corrections ({item.corrections.length})</summary>{item.corrections.map((correction) => <a key={`${item.id}-${correction.date}`} href={correction.url} target="_blank" rel="noopener noreferrer">{new Date(correction.date).toLocaleDateString("en-IN")}: {correction.note}</a>)}</details>}
      </article>;
    })}</div>
  </div>;
}
