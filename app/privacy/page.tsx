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
    <section><h2>What reaches the server</h2><p>When you run a search, its role, occupation, location, experience, qualification, job type, keyword rules and optional public ATS board URLs are sent to VEYRA’s search endpoint. Public feed responses are cached briefly and equivalent search results for five minutes. Resumes, profile fields, saved jobs, notes and application records are never included in those cache keys.</p></section>
    <section><h2>Job-link verification</h2><p>When you explicitly paste and check a job URL, that URL is sent to VEYRA’s verification endpoint and requested from the public destination. The check is not stored in a user profile or database. Do not paste private application links containing tokens or personal identifiers.</p></section>
    <section><h2>External links</h2><p>Opening a job listing or search launcher sends you to that provider. Their privacy terms then apply. VEYRA does not scrape LinkedIn, Indeed, Naukri, Foundit, Wellfound or Internshala.</p></section>
    <section><h2>Search feedback</h2><p>Reports show their full payload before transfer. Saving a report stores it on this device. Choosing the GitHub review link prepares a public issue that you must review and submit yourself. Resumes, profiles, notes and search history are excluded; listing URL query parameters are stripped.</p></section>
    <section><h2>Local reminders</h2><p>Deadline and follow-up alerts use browser permission and local settings. They are checked while the workspace is open and visible, and cannot reliably run when VEYRA is closed. Notification history stays on this device and can be deleted.</p></section>
    <section><h2>Delete or export</h2><p>Use “Delete all local VEYRA data” in the profile panel to remove VEYRA keys, feedback and reminder history from this browser. Use Backup before deletion if you want a portable copy.</p></section>
    <section><h2>Operational data</h2><p>The hosting provider may process routine request metadata such as IP addresses for delivery and security. VEYRA applies short-lived rate limits and does not use a user database. Source-health results contain provider availability and public vacancy counts only. VEYRA does not collect resume, profile or personal search analytics.</p></section>
    <section><h2>Support and corrections</h2><p>For privacy questions or incorrect listings, email <a href="mailto:akbsupportinfo@gmail.com">akbsupportinfo@gmail.com</a>. Do not email your resume, government ID or application credentials.</p></section>
    <Link className="button primary" href="/#search">Return to VEYRA</Link>
  </main>;
}
