import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://veyra-pro.vercel.app"),
  applicationName: "VEYRA",
  title: { default: "VEYRA · Job intelligence, without the noise", template: "%s · VEYRA" },
  description: "Search trustworthy jobs, government recruitment, PSU openings, exams and higher-study opportunities across India and global markets without creating an account.",
  keywords: ["job search", "jobs in India", "fresher jobs", "remote jobs", "government jobs", "PSU recruitment", "BPSC jobs", "IOCL recruitment", "graduate jobs", "international jobs", "VEYRA"],
  authors: [{ name: "VEYRA" }],
  creator: "VEYRA",
  publisher: "VEYRA",
  category: "employment",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "VEYRA",
    title: "VEYRA · Find work worth applying for",
    description: "Global opportunities, explainable matching and a local-first application workspace.",
    images: [{ url: "/social/og-default.png", width: 1200, height: 630, alt: "VEYRA · Find work worth applying for" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "VEYRA · Find work worth applying for",
    description: "Global opportunities, explainable matching and local-first privacy.",
    images: ["/social/og-default.png"]
  },
  appleWebApp: { capable: true, title: "VEYRA", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = { themeColor: "#18211d", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VEYRA",
    url: "https://veyra-pro.vercel.app/",
    description: "Privacy-first public job, recruitment and opportunity discovery.",
    inLanguage: "en",
    potentialAction: { "@type": "SearchAction", target: "https://veyra-pro.vercel.app/?q={search_term_string}#search", "query-input": "required name=search_term_string" },
    publisher: { "@type": "Organization", name: "VEYRA", url: "https://veyra-pro.vercel.app/", email: "akbsupportinfo@gmail.com" }
  };
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}><PwaRegister />{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} /></body>
    </html>
  );
}
