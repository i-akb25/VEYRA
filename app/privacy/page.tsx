import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Privacy and data handling",
  description: "How VEYRA processes searches, resumes and locally saved job-search data.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return <main className="policy-page">
    <Link className="wordmark" href="/" aria-label="VEYRA home"><BrandLogo priority /></Link>
    <p className="eyebrow">Privacy and data handling</p>
    <h1>Your job search stays yours.</h1>
    <section><h2>What stays in your browser</h2><p>Profile fields extracted from your resume, saved jobs, application notes, deadlines, career-board URLs and seen-job identifiers are stored in your browser’s local storage for this site. They are not synchronized across devices.</p></section>
    <section><h2>Resume processing</h2><p>PDF and DOCX parsing runs inside your browser. VEYRA does not upload the resume, raw resume text or extracted profile to its server. Raw text is discarded after extraction.</p></section>
    <section><h2>What reaches the server</h2><p>When you run a search, the role, location, experience level, qualification, negative keywords and optional public ATS board URLs are sent to VEYRA’s search endpoint. Public feed responses are cached for 20 minutes and equivalent search results for five minutes. Resumes, profile fields, saved jobs, notes and application records are never included in those cache keys.</p></section>
    <section><h2>External links</h2><p>Opening a job listing or search launcher sends you to that provider. Their privacy terms then apply. VEYRA does not scrape LinkedIn, Indeed, Naukri, Foundit, Wellfound or Internshala.</p></section>
    <section><h2>Delete or export</h2><p>Use “Delete all local VEYRA data” in the profile panel to remove VEYRA keys from this browser. Use Backup before deletion if you want a portable copy.</p></section>
    <section><h2>Operational data</h2><p>The hosting provider may process routine request metadata such as IP addresses for delivery and security. VEYRA applies a short-lived in-memory search rate limit and does not use a user database. Source-health checks contain provider status, latency and public vacancy counts only. VEYRA does not collect resume or profile analytics.</p></section>
    <section><h2>Support and corrections</h2><p>For privacy questions or incorrect listings, email <a href="mailto:akbsupportinfo@gmail.com">akbsupportinfo@gmail.com</a>. Do not email your resume, government ID or application credentials.</p></section>
    <Link className="button primary" href="/#search">Return to VEYRA</Link>
  </main>;
}
