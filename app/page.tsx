import { JobWorkspace } from "@/components/job-workspace";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content">
      <a className="skip-link" href="#search">Skip to opportunity search</a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="VEYRA home"><BrandLogo priority /></a>
        <nav aria-label="Primary navigation">
          <a href="#search">Search</a>
          <Link href="/jobs">Jobs</Link>
          <Link href="/government-jobs">Government</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/methodology">Method</Link>
          <Link href="/about">About</Link>
          <Link href="/hi" lang="hi">हिंदी</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <a className="header-cta" href="#search">Find roles</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A quieter way to search</p>
          <h1>Find work worth<br />applying for.</h1>
          <p className="hero-intro">
            Search jobs, government recruitment, examinations and higher-study routes across India
            and global markets. Your personal workspace stays on your device.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#search">Start a live search</a>
            <a className="text-link" href="#profile">Add optional profile <span>↘</span></a>
          </div>
        </div>
        <aside className="hero-note" aria-label="Product principles">
          <span className="note-index">01 / 03</span>
          <p>No account required.</p>
          <p>Students to experienced professionals.</p>
          <p>Unknown eligibility is never guessed.</p>
        </aside>
      </section>

      <JobWorkspace />

      <section className="principles" id="privacy">
        <div>
          <p className="eyebrow">Built around your boundaries</p>
          <h2>Your search is not<br />our product.</h2>
        </div>
        <div className="principle-list">
          <article><span>01</span><h3>Local by default</h3><p>Your profile, saved roles and notes remain in this browser.</p></article>
          <article><span>02</span><h3>Explicit transfers</h3><p>External job links open only when you choose. Nothing is silently uploaded.</p></article>
          <article><span>03</span><h3>Portable records</h3><p>Export your search and saved jobs as CSV or JSON whenever you need.</p></article>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><BrandLogo light /><p>Built for the search, not the scroll.</p></div>
        <nav aria-label="Footer navigation"><Link href="/jobs">Jobs</Link><Link href="/government-jobs">Government</Link><Link href="/exams-and-higher-studies">Exams</Link><Link href="/about">About</Link><Link href="/sources">Sources</Link><Link href="/sources/submit">Suggest source</Link><Link href="/methodology">Methodology</Link><Link href="/hi" lang="hi">हिंदी</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/privacy">Privacy</Link><a href="mailto:akbsupportinfo@gmail.com">Support</a><a href="#top">Back to top ↑</a></nav>
      </footer>
    </main>
  );
}
