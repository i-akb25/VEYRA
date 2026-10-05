"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null); const [hidden, setHidden] = useState(true);
  useEffect(() => { const receive = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); setHidden(false); }; window.addEventListener("beforeinstallprompt", receive); return () => window.removeEventListener("beforeinstallprompt", receive); }, []);
  if (hidden || !prompt) return null;
  return <aside className="install-prompt" aria-label="Install VEYRA"><div><strong>Install VEYRA</strong><span>Use saved jobs and your local workspace like an app.</span></div><button onClick={async () => { await prompt.prompt(); await prompt.userChoice; setHidden(true); }}>Install</button><button aria-label="Dismiss install prompt" onClick={() => setHidden(true)}>×</button></aside>;
}
