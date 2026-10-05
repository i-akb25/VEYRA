import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { GOVERNMENT_PAGES } from "@/lib/landing-pages";

export function generateStaticParams() { return GOVERNMENT_PAGES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = GOVERNMENT_PAGES.find((item) => item.slug === slug); return page ? { title: page.title, description: page.description, alternates: { canonical: `/government-jobs/${slug}` } } : {}; }
export default async function GovernmentLandingPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = GOVERNMENT_PAGES.find((item) => item.slug === slug); if (!page) notFound(); return <PublicPageShell eyebrow="Official public opportunities" title={page.title}><section><h2>Reviewed official sources</h2><p>{page.description} VEYRA does not scrape CAPTCHA-protected portals or invent deadlines, vacancy counts or eligibility.</p><Link className="button primary" href="/#search">Open the government desk</Link></section><section><h2>Verify before applying</h2><p>Open the issuing authority’s notification, check corrigenda, and confirm age, qualification, reservation, fee and closing-time rules.</p></section></PublicPageShell>; }
