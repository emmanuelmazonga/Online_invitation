import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "James & Diana | Wedding Invitation",
  description: "You are cordially invited to celebrate the wedding of James Konkola & Diana Mazonga · 21 November 2026 · Ndola, Zambia.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "James & Diana | Wedding Invitation",
    description: "You are cordially invited to celebrate the wedding of James Konkola & Diana Mazonga · 21 November 2026 · Ndola, Zambia.",
    url: siteUrl,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "James and Diana wedding invitation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "James & Diana | Wedding Invitation",
    description: "21 November 2026 · Ndola, Zambia",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
