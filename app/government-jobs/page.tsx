import type { Metadata } from "next";
import Link from "next/link";
import { GOVERNMENT_OPPORTUNITIES } from "@/lib/government";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Government jobs, PSU recruitment and apprenticeships",
  description: "Find official UPSC, SSC, BPSC, banking, railway, defence, IOCL, PSU and apprenticeship recruitment sources.",
  alternates: { canonical: "/government-jobs" }
};

export default function GovernmentJobsPage() {
  const groups = ["UPSC", "SSC", "BPSC", "State PSC", "Banking", "Railway", "Defence", "PSU", "Apprenticeship"] as const;
  return <PublicPageShell eyebrow="Government and public recruitment" title="Official notices before aggregator claims.">
    <section><h2>Recruitment categories</h2><p>VEYRA separates central examinations, Bihar and state commissions, banking, railways, defence, PSUs and apprenticeships. Open the issuing authority before relying on any deadline or qualification summary.</p><div className="landing-links">{groups.map((category) => <Link key={category} href="/#search">{category}<span>{GOVERNMENT_OPPORTUNITIES.filter((item) => item.category === category).length} official sources →</span></Link>)}</div></section>
    <section><h2>Major PSUs</h2><p>Official coverage includes IOCL, ONGC, NTPC, BHEL, GAIL, SAIL, POWERGRID and other public-sector recruitment sources. Each organisation controls its own advertisement, eligibility and application window.</p></section>
    <section><h2>No fake combined deadlines</h2><p>When an official page contains several advertisements, VEYRA labels the deadline as notice-specific rather than inventing a shared closing date.</p></section>
  </PublicPageShell>;
}
