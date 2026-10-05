import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = { title: "Offline", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return <main className="policy-page"><Link className="wordmark" href="/"><BrandLogo priority /></Link><p className="eyebrow">Offline</p><h1>Live sources need a connection.</h1><section><h2>Your local workspace is still yours</h2><p>Reconnect and return to VEYRA to search live feeds. Saved roles, profile fields and application records remain in this browser and are not uploaded while you are offline.</p></section><Link className="button primary" href="/">Return home</Link></main>;
}
