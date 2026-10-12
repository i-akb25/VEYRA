import { EmployerDirectory } from "@/components/employer-directory";
import type { Metadata } from "next";
import { employerDirectory } from "@/lib/employer-directory";
import { employerRegistry } from "@/lib/employers";
import { PublicPageShell } from "@/components/public-page-shell";
import { loadCoverageSummary } from "@/lib/career-data";

export const metadata: Metadata = { title: "Sources", description: "How VEYRA uses official employer feeds, career pages, government notices and safe job-portal launchers.", alternates: { canonical: "/sources" } };
export const revalidate = 900;

export default async function SourcesPage() {
  const coverageResult = await loadCoverageSummary();
  const coverage = coverageResult.value;
  return <PublicPageShell eyebrow="Source policy" title="Official where possible. Explicit when not.">
    <section><h2>Verified production coverage</h2><p>VEYRA currently has {coverage.configuredFeeds} configured public ATS feeds and {coverage.directoryEntries} named employer-directory entries representing {coverage.distinctDestinations} distinct feed or career destinations. The latest checked snapshot contains {coverage.snapshotJobs} vacancy links from {coverage.snapshotSources} scanned directory entries. Counts describe configured sources and observed listings, not total employers hiring or people being recruited. Data source: {coverageResult.source === "release" ? "live scheduled release" : "last verified bundled fallback"}.</p></section>
    <section><h2>Live public feeds</h2><p>VEYRA integrates {employerRegistry.length} configured Greenhouse, Lever, Ashby and SmartRecruiters feeds plus Remotive, Arbeitnow, Jobicy, Himalayas and Remote OK. Public responses are cached briefly to reduce provider load and every remote aggregator retains its source attribution.</p></section>
    <section><h2>Official employer directory</h2><p>The directory contains {employerDirectory.length} official employer career destinations across India and global markets. The scheduled crawler also recognises public Workday, Oracle Recruiting, SAP SuccessFactors, iCIMS, Oracle Taleo, Phenom and SmartRecruiters career pages when an official employer page links to them. A directory link is not presented as a live vacancy feed. This distinction prevents fake coverage claims.</p></section>
    <EmployerDirectory />
    <section><h2>Government and examinations</h2><p>UPSC, SSC, BPSC, state commissions, banking, railway, defence, PSU, apprenticeship and higher-study records link to issuing authorities. Private assessments are labelled separately. VEYRA never invents a deadline shared by multiple notices.</p></section>
    <section><h2>Restricted platforms</h2><p>LinkedIn, Indeed, Naukri, Foundit, Wellfound, Internshala and similar portals are opened through safe search links. VEYRA does not scrape or bypass their access controls.</p></section>
    <section><h2>Submit a source</h2><p>Use the <a href="/sources/submit">public source form</a> to prepare an auditable GitHub issue, or read <a href="https://github.com/i-akb25/VEYRA/blob/main/CONTRIBUTING.md">the contribution requirements</a> for a pull request. Include the employer’s official careers URL and a public ATS endpoint when available.</p></section>
  </PublicPageShell>;
}
