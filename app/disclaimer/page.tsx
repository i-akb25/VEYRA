import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = { title: "Disclaimer", description: "Important limits of VEYRA job, examination and higher-study information.", alternates: { canonical: "/disclaimer" } };

export default function DisclaimerPage() {
  return <PublicPageShell eyebrow="Important limits" title="Verify before you apply or pay.">
    <section><h2>No recruitment guarantee</h2><p>VEYRA does not represent employers, commissions, universities or testing providers. Search rank and fit explanations are decision aids, not promises of eligibility, interview or selection.</p></section>
    <section><h2>Official notice controls</h2><p>The source page controls the final vacancy status, qualification, reservation rules, age limits, fees, deadline, work authorisation and application method. Corrigenda may change a notice after VEYRA last checked it.</p></section>
    <section><h2>Fraud warning</h2><p>Do not pay individuals claiming to guarantee a role. Confirm the domain, organisation and payment instructions on the official site. Treat unexpected messages, shortened links and requests for banking credentials as suspicious.</p></section>
    <section><h2>Private assessments</h2><p>Private recruitment tests may charge fees and do not guarantee employment. Their current terms, score validity and participating employers must be checked before registration.</p></section>
  </PublicPageShell>;
}
