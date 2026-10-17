import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed, Newsreader } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: options strategies, compared honestly`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name}: options strategies, compared honestly`,
    description: site.tagline,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: options strategies, compared honestly`,
    description: site.tagline,
  },
  appleWebApp: { title: site.name },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#16150f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexMono.variable} ${plexCondensed.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
