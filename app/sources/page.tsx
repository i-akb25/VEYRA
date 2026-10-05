import type { Metadata } from "next";
import { employerDirectory } from "@/lib/employer-directory";
import { employerRegistry } from "@/lib/employers";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = { title: "Sources", description: "How VEYRA uses official employer feeds, career pages, government notices and safe job-portal launchers.", alternates: { canonical: "/sources" } };

export default function SourcesPage() {
  return <PublicPageShell eyebrow="Source policy" title="Official where possible. Explicit when not.">
    <section><h2>Live public feeds</h2><p>VEYRA currently integrates {employerRegistry.length} configured Greenhouse, Lever, Ashby and SmartRecruiters feeds plus Remotive and Arbeitnow. Public responses are cached briefly to reduce provider load.</p></section>
    <section><h2>Official employer directory</h2><p>The directory contains {employerDirectory.length} official employer career destinations across India and global markets. A directory link is not presented as a live vacancy feed. This distinction prevents fake coverage claims.</p></section>
    <section><h2>Government and examinations</h2><p>UPSC, SSC, BPSC, state commissions, banking, railway, defence, PSU, apprenticeship and higher-study records link to issuing authorities. Private assessments are labelled separately. VEYRA never invents a deadline shared by multiple notices.</p></section>
    <section><h2>Restricted platforms</h2><p>LinkedIn, Indeed, Naukri, Foundit, Wellfound, Internshala and similar portals are opened through safe search links. VEYRA does not scrape or bypass their access controls.</p></section>
    <section><h2>Submit a source</h2><p>Registry additions are accepted through GitHub pull requests. Read <a href="https://github.com/i-akb25/VEYRA/blob/main/CONTRIBUTING.md">the contribution requirements</a>, include the employer’s official careers URL and provide a public ATS endpoint when available.</p></section>
  </PublicPageShell>;
}
