"use client";

import { useMemo, useState } from "react";
import { GOVERNMENT_OPPORTUNITIES } from "@/lib/government";
import type { GovernmentCategory } from "@/lib/types";

const categories: Array<"All" | GovernmentCategory> = ["All", "UPSC", "SSC", "BPSC", "Banking", "Railway", "PSU", "Apprenticeship"];

export function GovernmentDesk() {
  const [category, setCategory] = useState<"All" | GovernmentCategory>("All");
  const [includeRecent, setIncludeRecent] = useState(false);
  const [now] = useState(() => Date.now());
  const records = useMemo(() => GOVERNMENT_OPPORTUNITIES.filter((item) => (category === "All" || item.category === category) && (includeRecent || item.deadline === null || Date.parse(item.deadline) >= now)).sort((a, b) => (a.deadline ? Date.parse(a.deadline) : Number.MAX_SAFE_INTEGER) - (b.deadline ? Date.parse(b.deadline) : Number.MAX_SAFE_INTEGER)), [category, includeRecent, now]);

  return <div className="government-desk">
    <div className="government-head">
      <div><p className="eyebrow">Official notices, not portal shortcuts</p><h3>Government opportunity desk</h3><p>VEYRA removes expired notices from the open view using their stated deadlines. Always verify eligibility, corrigenda and the final deadline on the issuing authority’s website.</p></div>
      <label className="check-label"><input type="checkbox" checked={includeRecent} onChange={(event) => setIncludeRecent(event.target.checked)} /><span>Show recent/closed notices</span></label>
    </div>
    <div className="government-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {records.length === 0 && <div className="empty-state compact"><span>○</span><h3>No verified open notice here.</h3><p>Enable recent notices or open the official portal under Sources. VEYRA will not display an unverified vacancy just to fill this page.</p></div>}
    <div className="government-list">{records.map((item) => {
      const closed = item.deadline !== null && Date.parse(item.deadline) < now;
      return <article className="government-card" key={item.id}>
        <div className="government-card-head"><div><p>{item.category} · {item.organization}</p><h4>{item.title}</h4></div><span className={closed ? "closed" : "open"}>{closed ? "Closed / recent" : item.deadline ? "Open" : "Verify window"}</span></div>
        <dl><div><dt>Notification</dt><dd>{new Date(item.notificationDate).toLocaleDateString("en-IN")}</dd></div><div><dt>Deadline</dt><dd>{item.deadline ? new Date(item.deadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Varies by notice; verify officially"}</dd></div><div><dt>Location</dt><dd>{item.location}</dd></div><div><dt>Qualification</dt><dd>{item.qualification}</dd></div></dl>
        {item.note && <p className="government-note">{item.note}</p>}
        <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">Open official notice ↗</a>
      </article>;
    })}</div>
  </div>;
}
