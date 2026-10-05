import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Jobs in India and worldwide",
  description: "Search fresher, experienced, onsite, hybrid and remote opportunities across technology, healthcare, finance, education, sales, marketing, administration, retail, hospitality and skilled trades.",
  alternates: { canonical: "/jobs" }
};

const searches = [
  ["All jobs", "/?roles=custom&industry=any&scope=any&workplaces=any&experience=any#search"],
  ["Student and fresher jobs", "/?roles=get&industry=any&scope=any&workplaces=any&experience=fresher#search"],
  ["Part-time jobs", "/?roles=custom&schedule=part-time&scope=any&workplaces=any&experience=any#search"],
  ["Healthcare jobs", "/?roles=healthcare&industry=healthcare&scope=any&workplaces=any&experience=any#search"],
  ["Sales and marketing jobs", "/?roles=sales%2Cmarketing&industry=any&scope=any&workplaces=any&experience=any#search"],
  ["Administration and clerical jobs", "/?roles=administration&industry=any&scope=any&workplaces=any&experience=any#search"],
  ["Education and research jobs", "/?roles=education%2Cscience&industry=education&scope=any&workplaces=any&experience=any#search"],
  ["Finance and accounting jobs", "/?roles=finance&industry=finance&scope=any&workplaces=any&experience=any#search"],
  ["Retail and hospitality jobs", "/?roles=retail%2Chospitality&industry=retail&scope=any&workplaces=any&experience=any#search"],
  ["Construction and skilled-trade jobs", "/?roles=construction%2Ctrades&industry=construction&scope=any&workplaces=any&experience=any#search"],
  ["Remote jobs", "/?roles=custom&industry=any&scope=any&workplaces=remote&experience=any#search"]
] as const;

export default function JobsPage() {
  return <PublicPageShell eyebrow="Public job discovery" title="Jobs for more than one kind of career.">
    <section><h2>Search across professions</h2><p>VEYRA covers technical and non-technical work for students, freshers, experienced professionals and career switchers. Choose a starting point below, then refine role, skill, industry, location, workplace, experience, qualification, salary and source.</p><div className="landing-links">{searches.map(([label, href]) => <Link key={label} href={href}>{label}<span>Search →</span></Link>)}</div></section>
    <section><h2>India and international markets</h2><p>Search India by city or region, or include the United States, Canada, United Kingdom, Europe, UAE, Singapore and Australia. Remote results distinguish worldwide roles from listings whose location restrictions are stated.</p></section>
    <section><h2>Private by default</h2><p>No account is required. Profiles, resumes, saved jobs, comparisons, notes and application stages stay in your browser. Shareable search URLs contain filters only.</p></section>
  </PublicPageShell>;
}
