import { JobWorkspace } from "@/components/job-workspace";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="VEYRA home">VEYRA<span>.</span></a>
        <nav aria-label="Primary navigation">
          <a href="#search">Search</a>
          <a href="#profile">Profile</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <a className="header-cta" href="#search">Find roles</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A quieter way to search</p>
          <h1>Find work worth<br />applying for.</h1>
          <p className="hero-intro">
            VEYRA brings live opportunities into one focused workspace, explains why a role fits,
            and keeps your personal data on your device.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#search">Start a live search</a>
            <a className="text-link" href="#profile">Add optional profile <span>↘</span></a>
          </div>
        </div>
        <aside className="hero-note" aria-label="Product principles">
          <span className="note-index">01 / 03</span>
          <p>No account required.</p>
          <p>No resume stored on our servers.</p>
          <p>Every match has a reason.</p>
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
        <p>VEYRA <span>·</span> Built for the search, not the scroll.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
