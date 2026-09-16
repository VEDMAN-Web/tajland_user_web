import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { getPublicEnv } from "@/lib/config/public-env";
import { brand } from "@/lib/constants/brand";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400"],
});

const publicEnv = getPublicEnv();

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: publicEnv.NEXT_PUBLIC_SITE_NAME,
    template: `%s | ${publicEnv.NEXT_PUBLIC_SITE_NAME}`,
  },
  description: brand.description,
  openGraph: {
    siteName: publicEnv.NEXT_PUBLIC_SITE_NAME,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cormorant.variable} ${playfairDisplay.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
