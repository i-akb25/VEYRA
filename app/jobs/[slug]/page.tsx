import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { PROFESSION_PAGES } from "@/lib/landing-pages";

export function generateStaticParams() { return PROFESSION_PAGES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = PROFESSION_PAGES.find((item) => item.slug === slug); return page ? { title: page.title, description: page.description, alternates: { canonical: `/jobs/${slug}` } } : {}; }
export default async function ProfessionPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = PROFESSION_PAGES.find((item) => item.slug === slug); if (!page) notFound(); const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: page.title, description: page.description, url: `https://veyra-pro.vercel.app/jobs/${page.slug}` }; return <PublicPageShell eyebrow="Profession search" title={page.title}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><section><h2>Search current listings</h2><p>{page.description} VEYRA searches attributed public APIs and employer career feeds. Availability and eligibility must still be confirmed at the original source.</p><Link className="button primary" href={page.search}>Open this search</Link></section><section><h2>Use precise filters</h2><p>Select exact or broad matching, qualification, experience, workplace, job type, required keywords and exclusions. Profiles and saved activity remain on your device.</p></section></PublicPageShell>; }
