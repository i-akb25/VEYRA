import type { Metadata } from "next";
import Link from "next/link";
import { GOVERNMENT_OPPORTUNITIES } from "@/lib/government";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Recruitment exams and higher studies",
  description: "Official sources for GATE, CAT, CUET-PG, UGC-NET, CSIR-NET and clearly labelled private recruitment assessments.",
  alternates: { canonical: "/exams-and-higher-studies" }
};

export default function ExamsPage() {
  const records = GOVERNMENT_OPPORTUNITIES.filter((item) => item.category === "Higher Studies" || item.category === "Private Exam");
  return <PublicPageShell eyebrow="Exams and higher studies" title="Know what an exam can and cannot do.">
    <section><h2>Official academic routes</h2><p>Use current issuing-authority pages for GATE, CAT, CUET-PG, UGC-NET and CSIR-NET. Eligibility, application windows and participating institutes change between cycles.</p><div className="landing-links">{records.map((item) => <a key={item.id} href={item.officialUrl} target="_blank" rel="noopener noreferrer">{item.title}<span>{item.organization} ↗</span></a>)}</div></section>
    <section><h2>Private recruitment assessments</h2><p>TCS NQT, AMCAT and eLitmus are labelled as private assessments. Fees, scores and participation do not guarantee an interview or job. Verify current terms before paying.</p></section>
    <section><h2>Search the complete desk</h2><p><Link href="/#search">Open VEYRA’s public opportunity desk</Link> for government recruitment, PSUs, apprenticeships and study routes in one local workspace.</p></section>
  </PublicPageShell>;
}
