import type { Metadata } from "next";
import React from "react";
import { getSiteMetadataSummary } from "@/service/site.service";
import "./globals.css";

const siteMeta = getSiteMetadataSummary();

export const metadata: Metadata = {
  title: {
    default: siteMeta.headlineTitle,
    template: `%s | ${siteMeta.name} (${siteMeta.domain})`
  },
  description: siteMeta.summary,
  metadataBase: new URL(siteMeta.canonicalUrl),
  applicationName: `${siteMeta.name} — ${siteMeta.domain}`,
  authors: [{ name: siteMeta.name, url: siteMeta.canonicalUrl }],
  creator: siteMeta.name,
  publisher: siteMeta.name,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteMeta.canonicalUrl,
    siteName: `${siteMeta.name} // ${siteMeta.domain}`,
    title: siteMeta.headlineTitle,
    description: siteMeta.summary
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.headlineTitle,
    description: siteMeta.summary
  },
  robots: {
    index: true,
    follow: true
  }
};

const FOUC_THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("color-scheme");
  var mode = (stored === "dark" || stored === "light") ? stored : "light";
  var meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute("content", mode);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(mode);
} catch (e) {}
`.trim();

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <script dangerouslySetInnerHTML={{ __html: FOUC_THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
