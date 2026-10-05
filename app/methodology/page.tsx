import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = { title: "Search methodology", description: "How VEYRA gathers, normalises, ranks, verifies and caches public job listings.", alternates: { canonical: "/methodology" } };

export default function MethodologyPage() {
  return <PublicPageShell eyebrow="Search methodology" title="Relevance should be explainable.">
    <section><h2>Collection</h2><p>VEYRA reads documented public ATS feeds and attributed public job APIs including remote-job sources that permit aggregation. Each provider has a timeout, one retry and a circuit breaker. Feed responses are cached and equivalent search results are cached for five minutes. User profiles and resumes are never part of a server cache key.</p></section>
    <section><h2>Normalisation</h2><p>Provider records are converted to one job shape, URLs are protocol-checked, HTML is reduced to text and likely duplicates are grouped by title, company and location. A live ATS response is treated as the strongest available signal that a listing remains open.</p></section>
    <section><h2>Ranking</h2><p>Exact title phrases and title tokens carry substantially more weight than description matches. Users can choose exact, balanced or broad discovery. Required terms must be present, optional terms improve ranking and exclusions remove unwanted titles. Location fit and freshness adjust the score. Fresher searches reject clearly senior titles and explicit three-plus-year requirements.</p></section>
    <section><h2>Eligibility</h2><p>Country, city, workplace, remote scope, sponsorship, work authorisation, language, experience, qualification, relocation and salary are extracted only from visible source text. Ambiguous or absent information is labelled “Not stated.” No eligibility field is guessed.</p></section>
    <section><h2>Source health</h2><p>The repository includes a source-verification command used before releases. During live search, repeated provider failures temporarily open a circuit breaker for that runtime instance. Other sources continue returning results instead of failing the entire search. Runtime health is not presented as historical uptime.</p></section>
    <section><h2>Vacancy status</h2><p>Listings returned by a current feed are marked live in that feed. Expiry dates close records automatically when supplied. The separate URL checker follows safe public redirects and looks for application or closure signals. Blocked, ambiguous and rate-limited pages return “Could not confirm,” never a guessed closure.</p></section>
  </PublicPageShell>;
}
