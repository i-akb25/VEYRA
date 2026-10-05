import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { LOCATION_PAGES } from "@/lib/landing-pages";

export function generateStaticParams() { return LOCATION_PAGES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = LOCATION_PAGES.find((item) => item.slug === slug); return page ? { title: page.title, description: page.description, alternates: { canonical: `/locations/${slug}` } } : {}; }
export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = LOCATION_PAGES.find((item) => item.slug === slug); if (!page) notFound(); const scope = slug === "international" ? "international" : "india"; const href = `/?roles=custom&location=${encodeURIComponent(page.location)}&scope=${scope}&workplaces=any&experience=any#search`; return <PublicPageShell eyebrow="Location search" title={page.title}><section><h2>Search the employment area</h2><p>{page.description} Enable nearby cities to include the whole recognised cluster, or disable it for stricter matching.</p><Link className="button primary" href={href}>Search {page.title}</Link></section><section><h2>Eligibility stays explicit</h2><p>Remote restrictions, work authorisation, visa sponsorship and relocation are shown as “Not stated” when the source does not provide them.</p></section></PublicPageShell>; }
