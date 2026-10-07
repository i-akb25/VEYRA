"use client";

import { useState } from "react";
import { feedbackPayload, type SearchGapContext } from "@/lib/search-feedback";
import type { Job } from "@/lib/types";

export function SearchFeedback({ job, onClose, context, visibleCount }: { job?: Job | null; onClose?: () => void; context?: SearchGapContext; visibleCount?: number }) {
  const [reason, setReason] = useState(job ? "closed job" : "no useful results");
  const [saved, setSaved] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const payload = feedbackPayload(reason, job, includeContext ? context : undefined, visibleCount);
  const preview = JSON.stringify(payload, null, 2);
  function save() {
    try {
      const key = "veyra.job-reports.v1";
      const previous = JSON.parse(localStorage.getItem(key) ?? "[]");
      localStorage.setItem(key, JSON.stringify([{ ...payload, reportedAt: new Date().toISOString() }, ...(Array.isArray(previous) ? previous : [])].slice(0, 100)));
      setSaved(true);
    } catch { setSaved(false); }
  }
  const issue = `https://github.com/i-akb25/VEYRA/issues/new?${new URLSearchParams({ title: `[Search feedback] ${reason}`, body: `Public search feedback. No resume, profile, notes or search history included.\n\n\`\`\`json\n${preview}\n\`\`\`` })}`;
  return <details className="source-health" data-search-feedback open={Boolean(job)}><summary>Report search quality</summary><div className="feedback-panel">
    <label><span>Problem</span><select value={reason} onChange={(event) => { setReason(event.target.value); setSaved(false); }}><option>no useful results</option><option>wrong role</option><option>wrong location</option><option>closed job</option><option>duplicate listing</option></select></label>
    {context && <label className="check-label"><input type="checkbox" checked={includeContext} onChange={(event) => { setIncludeContext(event.target.checked); setSaved(false); }} /><span>Include the selected role, location, filters and result count</span></label>}
    <p>This is the complete report. Your resume, profile, application notes and previous searches are excluded. URL query parameters are removed. Search words and filters can contain personal information you typed; review the preview before sharing.</p>
    <pre>{preview}</pre><button onClick={save}>Save report on this device</button>{saved && <p role="status">Saved locally. Nothing was submitted.</p>}
    <a className="button secondary" href={issue} target="_blank" rel="noopener noreferrer">Review public GitHub Issue ↗</a><p>GitHub requires an account. Review there and press Submit only if you want this report to be public.</p>{onClose && <button onClick={onClose}>Close report</button>}
  </div></details>;
}
