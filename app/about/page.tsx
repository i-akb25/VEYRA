import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = { title: "About", description: "VEYRA is a privacy-first public job discovery workspace for students, freshers, experienced professionals and career switchers.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <PublicPageShell eyebrow="About VEYRA" title="One search workspace. No account required.">
    <section><h2>What VEYRA is</h2><p>VEYRA is a public job-discovery and application workspace for students, freshers, experienced professionals and career switchers. It combines public employer feeds, official career pages, government notices, examinations and higher-study routes without turning your search history into a profile for sale.</p></section>
    <section><h2>What it does differently</h2><p>Search results are normalised, de-duplicated and ranked with title matches ahead of description matches. Eligibility fields expose what the source actually states. Missing facts remain “Not stated.” Saved jobs, resumes, notes and application stages stay in your browser.</p></section>
    <section><h2>What it is not</h2><p>VEYRA is not an employer, recruiter or application agent. It does not guarantee eligibility, sponsorship, selection or vacancy status. It does not submit applications, generate spam or scrape restricted job platforms.</p></section>
    <section><h2>Who it is for</h2><p>Technology is only one part of coverage. VEYRA supports engineering, skilled trades, healthcare, education, science, finance, sales, marketing, retail, hospitality, construction, operations and other public role families across India and international markets.</p></section>
  </PublicPageShell>;
}
