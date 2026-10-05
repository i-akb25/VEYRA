"use client";

import { FormEvent, useState } from "react";

type Result = { status: "live" | "closed" | "unknown"; reason: string; checkedAt: string; finalUrl?: string };

export function JobLinkVerifier() {
  const [url, setUrl] = useState(""); const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function verify(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null);
    try { const response = await fetch("/api/jobs/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }); const body = await response.json() as Result & { error?: string }; if (!response.ok) throw new Error(body.error || "Verification failed."); setResult(body); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Verification failed."); }
    finally { setLoading(false); }
  }
  return <section className="link-verifier" aria-labelledby="link-verifier-title">
    <div><p className="eyebrow">Job status check</p><h3 id="link-verifier-title">Is this vacancy still live?</h3><p>Paste the original employer or job-board link. VEYRA checks only public signals and never treats a blocked page as proof that a vacancy is closed.</p></div>
    <form onSubmit={verify}><label><span>Job-posting URL</span><input type="url" inputMode="url" required placeholder="https://company.com/jobs/role" value={url} onChange={(event) => setUrl(event.target.value)} /></label><button className="button primary" disabled={loading}>{loading ? "Checking…" : "Check status"}</button></form>
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className={`verification-result ${result.status}`} role="status"><strong>{result.status === "live" ? "Likely live" : result.status === "closed" ? "Likely closed" : "Could not confirm"}</strong><p>{result.reason}</p><small>Checked {new Date(result.checkedAt).toLocaleString()}</small>{result.finalUrl && <a href={result.finalUrl} target="_blank" rel="noopener noreferrer">Open checked page ↗</a>}</div>}
    <p className="verifier-caveat">A live result is evidence, not a guarantee. Always confirm the deadline and application button on the original page.</p>
  </section>;
}
