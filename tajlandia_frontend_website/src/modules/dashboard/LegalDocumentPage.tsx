"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { routes } from "@/lib/constants/routes";
import { useOptionalDashboardLanguage } from "./DashboardLanguageContext";

type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
  cards?: Array<{ title: string; body: string; tone?: "plain" | "red" }>;
};

const privacySections: LegalSection[] = [
  {
    title: "Information We Collect",
    paragraphs: [
      "Tajlandia collects explicit categories of information to allocate physical and spatial plots, ensure statutory cadastre integrity, and maintain institutional records.",
    ],
    cards: [
      {
        title: "Account Credentials",
        body: "Full legal name, preferred username, identity validation credentials, authenticated avatar, and cryptographic public keys.",
      },
      {
        title: "Contact Metadata",
        body: "Verified email address, primary residential or corporate billing address, country of tax domicile, and restricted contact phone numbers.",
      },
      {
        title: "Purchase & Transaction Records",
        body: "Plot serial identifiers, assigned spatial zone designations, Rai area quantities, coordinate bounds, ledger anchors, and transaction receipts.",
      },
      {
        title: "Plot & Collection Metadata",
        body: "User-customized parcel tags, portfolio groupings, deed generation hashes, and cryptographic ledger identifiers.",
      },
      {
        title: "Support Communications",
        body: "Inquiries, dispute resolutions, cadastre verification requests, and transcripts of support interactions.",
      },
      {
        title: "Technical & Telemetry Data",
        body: "Public IP addresses, browser specifications, operating system versions, and interaction telemetry required to guarantee interface security.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: [
      "Information entrusted to Tajlandia is utilized under strict lawful bases including contractual performance, compliance with international and transparency laws, and legitimate interests.",
    ],
    cards: [
      {
        title: "Platform Administration",
        body: "Providing, maintaining, calibrating, and optimizing the Tajlandia spatial interface and land registry.",
      },
    ],
  },
  {
    title: "Information Sharing",
    paragraphs: [
      "We share information only with verified service providers, legal authorities when required, and parties necessary to complete an explicitly requested transaction.",
    ],
  },
  {
    title: "Payments & Card Security",
    paragraphs: [
      "Payment information is processed by compliant payment providers. Tajlandia does not store complete payment card numbers on its own systems.",
    ],
  },
  {
    title: "Cookies & Similar Technologies",
    paragraphs: [
      "We use essential cookies and similar technologies to keep sessions secure, remember preferences, and understand aggregate product usage.",
    ],
  },
  {
    title: "Data Security Architecture",
    paragraphs: [
      "Access controls, encryption, audit logging, and least-privilege operations are used to protect information against unauthorized access.",
    ],
  },
  {
    title: "Data Retention Guidelines",
    paragraphs: [
      "Information is retained only for as long as needed for the purposes described here, contractual records, legal requirements, or dispute resolution.",
    ],
  },
  {
    title: "Your Privacy Rights",
    paragraphs: [
      "Depending on your location, you may request access, correction, deletion, restriction, portability, or objection to certain processing activities.",
    ],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      "Tajlandia services are not directed to children. We do not knowingly collect personal information from children without required consent.",
    ],
  },
  {
    title: "International Data Transfers",
    paragraphs: [
      "When information is transferred internationally, we use appropriate safeguards and contractual protections required by applicable law.",
    ],
  },
  {
    title: "Policy Modifications",
    paragraphs: [
      "We may update this policy as the service, law, or security practices change. The latest version is made available through this page.",
    ],
  },
  {
    title: "Contact Data Protection",
    paragraphs: [
      "For privacy questions or requests, contact the Tajlandia support team through the Help & Support page.",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    title: "About Tajlandia",
    paragraphs: [
      "Tajlandia operates as an exclusive, curated spatial computing and digital registry platform dedicated to commemorative land archiving, environmental conservation awareness, and cultural preservation across the Kingdom of Thailand. By indexing geographical sectors into verifiable digital coordinate matrices, Tajlandia allows patrons and investors worldwide to adopt symbolic parcel holdings.",
    ],
    cards: [
      {
        title: "Important Legal Distinction",
        body: "Tajlandia digital ownership records, cadastral, and associated digital certificates represent symbolic, commemorative virtual holdings. They do not constitute official Thai land title deeds, such as Chanote, Nor Sor 3 Gor, freehold estates, agricultural concessions, or statutory property rights under the Civil and Commercial Code.",
        tone: "red",
      },
    ],
  },
  {
    title: "Eligibility & Account",
    paragraphs: [
      "To access registry functions, procure spatial collections, or mint digital verification deeds on Tajlandia, you must meet the following basic requirements:",
      "You must be at least 18 years of age or the legal age of majority in your jurisdiction of residence.",
      "You must create an authorized user profile providing accurate, complete legal verification data.",
      "You are responsible for maintaining the confidentiality of your login credentials and multi-factor authentication devices.",
      "Tajlandia reserves the right to suspend or terminate accounts found using unauthorized credentials, falsified identity markers, or privacy methods intended to bypass localized sanctions.",
    ],
  },
  {
    title: "Exploring and Selecting Plots",
    paragraphs: [
      "Parcel categories within the interactive cadastral map are partitioned into discrete geographic tiers reflecting geographical prominence, exclusivity, uniqueness, and spatial recording.",
    ],
    cards: [
      {
        title: "Sector Zone A",
        body: "Standard Plots\nInland plains, baseline conservation buffer zones, and open agricultural grids.",
      },
      {
        title: "Sector Zone B",
        body: "Premium Plots\nCoastal reserves, elevated foothill territories, and primary tourist corridors.",
      },
      {
        title: "Sector Zone C",
        body: "Icon Plots\nHighly-visible coastal islands, cultural landmarks, and rare heritage coordinates.",
        tone: "red",
      },
    ],
  },
  {
    title: "Purchases & Payments",
    paragraphs: [
      "All transactions conducted on Tajlandia are settled through PCI-DSS Level 1 certified gateway partners supporting major credit networks and designated international wires. By executing an order, you warrant that you are authorized to utilize the chosen payment instrument.",
    ],
  },
  {
    title: "Minimum Purchase Requirement",
    paragraphs: [
      "Minimum collection requirements may apply to certain spatial zones. Details are shown before you confirm a purchase and may change with availability.",
    ],
  },
  {
    title: "Ownership & Digital Certificates",
    paragraphs: [
      "A certificate records your symbolic collection and its registry metadata. It does not transfer legal title, possession, development rights, or an interest in real property.",
    ],
  },
  {
    title: "Gifts & Gift Claims",
    paragraphs: [
      "Eligible collections may be gifted to another registered user. The giver is responsible for entering accurate recipient information and ensuring the recipient accepts the transfer.",
    ],
  },
  {
    title: "Cancellations & Refunds",
    paragraphs: [
      "Cancellation and refund eligibility depends on the order status and the payment partner rules shown at checkout. Contact support promptly if an order needs review.",
    ],
  },
  {
    title: "User Responsibilities",
    paragraphs: [
      "Users must provide accurate information, protect account credentials, respect applicable laws, and avoid attempts to manipulate registry data or platform availability.",
    ],
  },
  {
    title: "Privacy & Data",
    paragraphs: [
      "Information is handled according to the Tajlandia Privacy Policy. By using the platform, you acknowledge the collection and processing described there.",
    ],
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "We may revise these terms to reflect service, legal, or security changes. Continued use after publication constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [
      "Questions about these terms can be submitted through the Help & Support page or by contacting support@tajlandia.com.",
    ],
  },
];

export function LegalDocumentPage({
  kind,
  publicPage = false,
}: {
  kind: "privacy" | "terms";
  publicPage?: boolean;
}) {
  const { t } = useOptionalDashboardLanguage();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPrivacy = kind === "privacy";
  const sections = isPrivacy ? privacySections : termsSections;
  const title = isPrivacy ? t("Privacy Policy") : t("Terms & Condition");
  const subtitle = isPrivacy
    ? "Learn how we protect and use your information."
    : "Know the rules and terms of using Tajlandia.";

  if (!publicPage && isLoading) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">
        Loading document...
      </main>
    );
  }
  if (!publicPage && !isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      {publicPage ? <SiteHeader /> : <DashboardNavbar active="home" />}
      <main
        className={
          publicPage
            ? "mx-auto w-[92%] max-w-none px-5 pb-16 pt-10 sm:px-8 sm:pt-14"
            : "mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14"
        }
      >
        {publicPage ? null : <AccountMenu active={isPrivacy ? "privacy" : "terms"} />}
        <section className="min-w-0">
          <div className="flex items-start justify-between gap-4 border-b border-[#e1e8ed] pb-3">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-navy sm:text-[30px]">
                {title}
              </h1>
              <p className="mt-1 text-[10px] text-[#7b858f]">{subtitle}</p>
            </div>
            <span className="mt-1 rounded-full bg-white px-3 py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-navy shadow-[0_3px_10px_rgba(11,31,77,0.06)]">
              <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-brand-red" />
              Legal Documentation
            </span>
          </div>

          <nav
            aria-label="Table of Contents"
            className="mt-4 rounded-[9px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.05)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold uppercase tracking-[0.04em] text-[#242b32]">
                ▤ &nbsp;Table of Contents
              </h2>
              <span className="text-[11px] uppercase text-[#9aa3ad]">
                {sections.length} Sections
              </span>
            </div>
            <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {sections.map((section, index) => (
                <Link
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="flex min-w-0 items-center gap-2 text-[13px] text-[#8b949e] hover:text-navy"
                >
                  <b className="w-5 text-[11px] text-[#242b32]">
                    {String(index + 1).padStart(2, "0")}
                  </b>
                  <span className="truncate">{section.title}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-5 space-y-6">
            {sections.map((section, index) => (
              <article
                id={`section-${index + 1}`}
                key={section.title}
                className="scroll-mt-24"
              >
                <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#242b32]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-[#171717] text-[8px] text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <div className="mt-2 space-y-2 text-[14px] leading-[1.55] text-[#8b949e]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.cards ? (
                  <div className="mt-3 grid gap-2">
                    {section.cards.map((card) => (
                      <div
                        key={card.title}
                        className={`whitespace-pre-line rounded-[8px] bg-white px-3 py-3 text-[13px] leading-[1.45] shadow-[0_3px_12px_rgba(11,31,77,0.04)] ${card.tone === "red" ? "border border-[#f0d18b] bg-[#fffdf4] text-[#bd8a00]" : "text-[#8b949e]"}`}
                      >
                        <strong
                          className={`mr-1 text-[13px] ${card.tone === "red" ? "text-[#bd8a00]" : "text-[#242b32]"}`}
                        >
                          {card.title}:
                        </strong>
                        {card.body}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>
      {publicPage ? <SiteFooter /> : null}
    </div>
  );
}
