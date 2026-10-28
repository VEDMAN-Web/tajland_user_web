import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Inter,
  Manrope,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { getPublicEnv } from "@/lib/config/public-env";
import { htmlLang, openGraphLocale } from "@/lib/i18n/locale";
import { siteCopy } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { defaultOgImage, isIndexingDisabled } from "@/lib/seo/indexing";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "latin-ext"],
  weight: ["600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
});

const publicEnv = getPublicEnv();

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: {
      default: publicEnv.NEXT_PUBLIC_SITE_NAME,
      template: `%s | ${publicEnv.NEXT_PUBLIC_SITE_NAME}`,
    },
    description: siteCopy[locale].description,
    openGraph: {
      siteName: publicEnv.NEXT_PUBLIC_SITE_NAME,
      type: "website",
      locale: openGraphLocale(locale),
      images: [defaultOgImage],
    },
    // Test hosts never get indexed; pages add their own robots tags on top.
    ...(isIndexingDisabled() ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={htmlLang(locale)}
      className={`${plusJakarta.variable} ${cormorant.variable} ${playfairDisplay.variable} ${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
