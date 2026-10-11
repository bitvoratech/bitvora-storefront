import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "../lib/fonts";

export const metadata: Metadata = {
  title: "Bitvora Storefront",
  description: "Storefronts that look like your brand.",
  ...(process.env.NEXT_PUBLIC_STOREFRONT_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL) }
    : {}),
};

// viewportFit "cover" exposes the safe-area insets used by the sticky
// mobile buy bar, so it clears the iPhone home indicator.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${fontVariables}`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}