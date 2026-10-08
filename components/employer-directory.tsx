"use client";
import { useState } from "react";
import { employerDirectory } from "@/lib/employer-directory";
import { employerRegistry, publicBoardUrl } from "@/lib/employers";
import snapshot from "@/data/career-snapshot.json";
export function EmployerDirectory() {
  const [query, setQuery] = useState("");
  const entries = [...employerDirectory.map((item) => ({ name: item.name, url: item.careersUrl, label: "Official careers page", count: undefined as number | undefined, checkedAt: undefined as string | undefined })), ...employerRegistry.map((item) => ({ name: item.name, url: publicBoardUrl(item), label: "Public vacancy feed", count: item.verifiedJobCount, checkedAt: item.verifiedAt }))];
  const unique = [...new Map(entries.map((item) => [item.url, item])).values()].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  return <section><h2>Browse career pages</h2><label>Employer name <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TCS, Infosys, Google…" /></label><p>{unique.length} destinations. Employers remain listed when they have no openings. An unavailable check does not mean zero jobs.</p><ul>{unique.map((item) => {
    const source = (snapshot.sources as Array<{url: string; checkedAt: string; status: string; count: number | null}>).find((source) => source.url === item.url);
    return <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.name}</a> · {item.label}{item.count !== undefined && <> · {item.count} advertised listings at {item.checkedAt} (not total hires)</>}{source && <> · {source.status} · {source.count === null ? "Count not confirmed" : `${source.count} structured listings found`} · Checked {source.checkedAt}</>}</li>;
  })}</ul></section>;
}
