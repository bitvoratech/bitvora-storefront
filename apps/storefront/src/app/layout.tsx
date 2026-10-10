import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "../lib/fonts";

export const metadata: Metadata = {
  title: "Bitvora Storefront",
  description: "Storefronts that look like your brand.",
  ...(process.env.NEXT_PUBLIC_STOREFRONT_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL) }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${fontVariables}`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}