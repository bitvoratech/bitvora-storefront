import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { MotionSafety } from "@/components/MotionSafety";
import { MotionProvider } from "@/components/MotionProvider";
import { SITE_URL } from "@/lib/site";

// Self-hosted by next/font: no render-blocking request to Google Fonts,
// which matters most on mobile data.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

const title = "Bitvora Stores — Storefronts that look like your brand";
const description = "Build a beautiful, branded online store for your business in minutes. No template look, no code required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Bitvora Stores",
    title,
    description,
    locale: "en_NG",
    images: [{ url: "/brand/og-image.png" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og-image.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b2559",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
      <head>
        <MotionSafety />
      </head>
      <body className="min-h-full antialiased bg-paper text-ink overflow-x-hidden">
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
