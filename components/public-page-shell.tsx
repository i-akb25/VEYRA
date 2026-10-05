import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function PublicPageShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="policy-page" id="main-content">
    <a className="skip-link" href="#public-content">Skip to content</a>
    <header className="policy-header"><Link className="wordmark" href="/" aria-label="VEYRA home"><BrandLogo priority /></Link><nav aria-label="Public information"><Link href="/jobs">Jobs</Link><Link href="/government-jobs">Government</Link><Link href="/about">About</Link><Link href="/sources">Sources</Link><Link href="/sources/submit">Suggest source</Link><Link href="/methodology">Methodology</Link><Link href="/hi" lang="hi">हिंदी</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Disclaimer</Link></nav></header>
    <div id="public-content"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
    {children}
    <section className="support-block"><h2>Questions or corrections</h2><p>Email <a href="mailto:akbsupportinfo@gmail.com">akbsupportinfo@gmail.com</a>. Include the official source URL when reporting an incorrect or expired listing.</p></section>
    <Link className="button primary" href="/#search">Search opportunities</Link>
  </main>;
}
