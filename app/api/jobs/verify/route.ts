import { isIP } from "node:net";
import { resolve } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ url: z.string().url().max(2000) });
const buckets = new Map<string, { count: number; resetAt: number }>();

function privateAddress(address: string): boolean {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

async function safeUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Only normal HTTPS job links are supported.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || isIP(host) && privateAddress(host)) throw new Error("Private network addresses are not allowed.");
  const addresses = await resolve(host);
  if (!addresses.length || addresses.some(privateAddress)) throw new Error("Private network addresses are not allowed.");
  return url;
}

async function readSnippet(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader(); let received = 0; const chunks: Uint8Array[] = [];
  while (received < 65_536) { const { done, value } = await reader.read(); if (done) break; if (value) { chunks.push(value); received += value.byteLength; } }
  await reader.cancel().catch(() => undefined);
  const joined = new Uint8Array(Math.min(received, 65_536)); let offset = 0;
  for (const chunk of chunks) { const part = chunk.slice(0, joined.length - offset); joined.set(part, offset); offset += part.length; if (offset >= joined.length) break; }
  return new TextDecoder().decode(joined);
}

async function inspect(raw: string) {
  let url = await safeUrl(raw);
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000), headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "VEYRA/2.0 job-status-checker" }, cache: "no-store" });
    if ([301, 302, 303, 307, 308].includes(response.status)) { const location = response.headers.get("location"); if (!location) break; url = await safeUrl(new URL(location, url).toString()); continue; }
    const checkedAt = new Date().toISOString();
    if ([404, 410].includes(response.status)) return { status: "closed", reason: `The source returned HTTP ${response.status}.`, checkedAt, finalUrl: url.toString() };
    if ([401, 403, 429].includes(response.status)) return { status: "unknown", reason: `The source blocked verification with HTTP ${response.status}. This does not prove the job is closed.`, checkedAt, finalUrl: url.toString() };
    if (response.status >= 500) return { status: "unknown", reason: `The source is temporarily unavailable (HTTP ${response.status}).`, checkedAt, finalUrl: url.toString() };
    const snippet = (await readSnippet(response)).toLowerCase().replace(/\s+/g, " ");
    const closedSignals = ["job is no longer available", "position has been filled", "position is no longer available", "job posting has expired", "this job has expired", "no longer accepting applications", "job not found", "vacancy is closed"];
    const liveSignals = ["apply for this job", "apply now", "submit application", "job description", "application form"];
    if (closedSignals.some((signal) => snippet.includes(signal))) return { status: "closed", reason: "The employer page states that the vacancy is unavailable, filled or expired.", checkedAt, finalUrl: url.toString() };
    if (response.ok && liveSignals.some((signal) => snippet.includes(signal))) return { status: "live", reason: "The page is reachable and still exposes job or application content.", checkedAt, finalUrl: url.toString() };
    return { status: "unknown", reason: response.ok ? "The page is reachable, but it does not provide enough evidence to confirm whether applications remain open." : `The source returned HTTP ${response.status}.`, checkedAt, finalUrl: url.toString() };
  }
  return { status: "unknown", reason: "Too many redirects prevented a safe verification.", checkedAt: new Date().toISOString(), finalUrl: url.toString() };
}

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"; const now = Date.now(); const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now && bucket.count >= 12) return NextResponse.json({ error: "Too many checks. Wait one minute and try again." }, { status: 429, headers: { "Retry-After": "60" } });
  buckets.set(key, !bucket || bucket.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { ...bucket, count: bucket.count + 1 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste a complete HTTPS job-posting URL." }, { status: 400 });
  try { return NextResponse.json(await inspect(parsed.data.url), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ status: "unknown", reason: error instanceof Error ? error.message : "The link could not be checked.", checkedAt: new Date().toISOString() }); }
}
