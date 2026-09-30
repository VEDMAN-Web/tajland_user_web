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

type CardIcon = "user" | "pin" | "receipt" | "map" | "support" | "monitor" | "gear" | "warning";

type LegalCard = {
  title: string;
  body: string;
  kicker?: string;
  tone?: "plain" | "red" | "warning";
  icon?: CardIcon;
};

type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
  note?: string;
  cardLayout?: "inline" | "zones";
  cards?: LegalCard[];
};

function CardGlyph({ name }: { name: CardIcon }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      {name === "user" ? (
        <>
          <circle cx="12" cy="8" r="3" {...common} />
          <path d="M5.5 19.5c1.2-3 3.5-4.5 6.5-4.5s5.3 1.5 6.5 4.5" {...common} />
        </>
      ) : null}
      {name === "pin" ? (
        <>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" {...common} />
          <circle cx="12" cy="11" r="2" {...common} />
        </>
      ) : null}
      {name === "receipt" ? (
        <>
          <path d="M7 3.5h10v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V3.5Z" {...common} />
          <path d="M9.5 8h5M9.5 11.5h5" {...common} />
        </>
      ) : null}
      {name === "map" ? (
        <>
          <path d="M4 6.5 9 4.5l6 2.5 5-2v13l-5 2-6-2.5-4 2V6.5Z" {...common} />
          <path d="M9 4.5v13M15 7v13" {...common} />
        </>
      ) : null}
      {name === "support" ? (
        <>
          <path d="M5 12a7 7 0 0 1 14 0" {...common} />
          <path d="M5 12v4.5A1.5 1.5 0 0 0 6.5 18H8v-6H6.5A1.5 1.5 0 0 0 5 13.5V12ZM19 12v1.5A1.5 1.5 0 0 1 17.5 15H16v-6h1.5A1.5 1.5 0 0 1 19 10.5V12Z" {...common} />
          <path d="M12 18h3.5a2 2 0 0 0 2-2" {...common} />
        </>
      ) : null}
      {name === "monitor" ? (
        <>
          <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" {...common} />
          <path d="M8 20.5h8M12 16.5v4" {...common} />
        </>
      ) : null}
      {name === "gear" ? (
        <>
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" {...common} />
        </>
      ) : null}
      {name === "warning" ? (
        <>
          <path d="M12 3.8 21 19.2H3L12 3.8Z" {...common} />
          <path d="M12 9.2v4.4M12 16.4h.01" {...common} />
        </>
      ) : null}
    </svg>
  );
}

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
        icon: "user",
      },
      {
        title: "Contact Metadata",
        body: "Verified email address, primary residential or corporate billing address, country of tax domicile, and restricted contact phone numbers.",
        icon: "pin",
      },
      {
        title: "Purchase & Transaction Records",
        body: "Plot serial identifiers, assigned spatial zone designations, Rai area quantities, coordinate bounds, ledger anchors, and transaction receipts.",
        icon: "receipt",
      },
      {
        title: "Plot & Collection Metadata",
        body: "User-customized parcel tags, portfolio groupings, deed generation hashes, and cryptographic ledger identifiers.",
        icon: "map",
      },
      {
        title: "Support Communications",
        body: "Inquiries, dispute resolutions, cadastre verification requests, and transcripts of support interactions.",
        icon: "support",
      },
      {
        title: "Technical & Telemetry Data",
        body: "Public IP addresses, browser specifications, operating system versions, and interaction telemetry required to guarantee interface security.",
        icon: "monitor",
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
        icon: "gear",
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
        tone: "warning",
        icon: "warning",
      },
    ],
  },
  {
    title: "Eligibility & Account",
    paragraphs: [
      "To access registry functions, procure spatial collections, or mint digital verification deeds on Tajlandia, you must meet the following baseline requirements:",
    ],
    items: [
      "You must be at least 18 years of age or the legal age of majority in your jurisdiction of residence.",
      "You must create an authorized user profile providing accurate, complete legal verification data.",
      "You are strictly responsible for maintaining the confidentiality of your login credentials and multi-factor authentication devices.",
      "Tajlandia reserves the right to suspend or terminate accounts found using unauthorized credentials, falsified identity markers, or proxy networks intended to bypass localized sanctions.",
    ],
  },
  {
    title: "Exploring and Selecting Plots",
    paragraphs: [
      "Parcel categories within the interactive cadastral map are partitioned into discrete geographic tiers reflecting geographical prominence, ecosystem uniqueness, and spatial coordinates:",
    ],
    cardLayout: "zones",
    cards: [
      {
        kicker: "Sector Zone A",
        title: "Standard Plots",
        body: "Inland plains, baseline conservation buffer zones, and open agricultural grids.",
      },
      {
        kicker: "Sector Zone B",
        title: "Premium Plots",
        body: "Coastal reserves, elevated foothill matrices, and primary rainforest perimeters.",
      },
      {
        kicker: "Sector Zone C",
        title: "Icon Plots",
        body: "High-visibility coastal islands, cultural landmarks, and rare heritage coordinates.",
        tone: "red",
      },
    ],
    note: "Cadastral availability is rendered in real time. A plot placed in your cart remains reserved for 15 minutes prior to automated release back to public registry availability.",
  },
  {
    title: "Purchases & Payments",
    paragraphs: [
      "All transactions executed on Tajlandia are settled through PCI-DSS Level 1 certified gateway partners (Stripe) supporting major credit networks and designated international wires. By executing an order, you warrant that you are authorized to utilize the chosen payment instrument. Charges will reflect on billing records under the descriptor: TAJLANDIA LAND HOLDINGS LTD.",
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
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      {publicPage ? <SiteHeader /> : <DashboardNavbar active="home" />}
      <main
        className={
          publicPage
            ? "mx-auto w-full max-w-[1180px] px-5 pb-16 pt-10 sm:px-8"
            : "mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7"
        }
      >
        {publicPage ? null : <AccountMenu active={isPrivacy ? "privacy" : "terms"} />}
        <section className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                {title}
              </h1>
              <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">{t(subtitle)}</p>
            </div>
            <p className="mt-1 flex shrink-0 items-center gap-1.5 font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-navy">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e11d2e]" />
              {t("Legal Documentation")}
            </p>
          </div>

          <nav aria-label={t("Table of Contents")} className="mt-5 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-manrope flex items-center gap-2 text-[14px] font-semibold leading-5 text-[#1a1a1a]">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 text-[#66717c]">
                  <path d="M3 4h10M3 8h10M3 12h7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {t(isPrivacy ? "Table of Contents" : "Contents")}
              </h2>
              <span className="font-manrope text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b939e]">
                {sections.length} {t("Sections")}
              </span>
            </div>
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {sections.map((section, index) => (
                <Link
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="flex min-w-0 items-center gap-2 font-manrope text-[13px] leading-5 text-[#66717c] hover:text-navy"
                >
                  <span className="w-5 shrink-0 font-semibold text-[#1a1a1a]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="truncate">{t(section.title)}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-6 grid gap-7">
            {sections.map((section, index) => (
              <article id={`section-${index + 1}`} key={section.title} className="scroll-mt-24">
                <h2 className="font-manrope flex items-center gap-2.5 text-[18px] font-semibold leading-6 text-[#1a1a1a]">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] bg-[#1a1a1a] font-manrope text-[10px] font-semibold leading-none text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {t(section.title)}
                </h2>
                <div className="mt-2 grid gap-2">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="font-manrope text-[14px] leading-6 text-[#8b939e]">
                      {t(paragraph)}
                    </p>
                  ))}
                </div>
                {section.items ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 font-manrope text-[14px] leading-6 text-[#8b939e]">
                    {section.items.map((item) => (
                      <li key={item}>{t(item)}</li>
                    ))}
                  </ul>
                ) : null}
                {section.cards ? (
                  <div className={`mt-3 grid gap-3 ${section.cardLayout === "zones" ? "sm:grid-cols-3" : ""}`}>
                    {section.cards.map((card) =>
                      section.cardLayout === "zones" ? (
                        <div key={card.title} className="rounded-[16px] border border-[#e6ebf0] bg-white px-5 py-[18px]">
                          <p className={`font-manrope text-[11px] font-semibold uppercase tracking-[0.12em] ${card.tone === "red" ? "text-[#e11d2e]" : "text-[#8b939e]"}`}>{t(card.kicker ?? "")}</p>
                          <p className="font-manrope mt-2 text-[15px] font-bold leading-5 text-[#111111]">{t(card.title)}</p>
                          <p className="font-manrope mt-1.5 text-[13px] leading-[1.45] text-[#8b939e]">{t(card.body)}</p>
                        </div>
                      ) : card.tone === "warning" ? (
                        <div key={card.title} className="flex items-start gap-3 rounded-[12px] border border-[#ead7a2] bg-[#fffdf6] px-4 py-3">
                          <span className="mt-0.5 text-[#c4a035]">
                            <CardGlyph name="warning" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-manrope text-[14px] font-semibold leading-5 text-[#8a6420]">{t(card.title)}</p>
                            <p className="font-manrope mt-1 text-[13px] leading-5 text-[#9a7430]">{t(card.body)}</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={card.title}
                          className={`flex items-start gap-3 rounded-[12px] px-4 py-3 shadow-[0_4px_16px_rgba(11,31,77,0.04)] ${card.tone === "red" ? "border border-[#f0d18b] bg-[#fffdf4]" : "bg-white"}`}
                        >
                          {card.icon ? (
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${card.tone === "red" ? "bg-[#fff6df] text-[#bd8a00]" : "bg-[#f4f7fb] text-[#3d4650]"}`}>
                              <CardGlyph name={card.icon} />
                            </span>
                          ) : null}
                          <p className={`font-manrope whitespace-pre-line text-[13px] leading-5 ${card.tone === "red" ? "text-[#bd8a00]" : "text-[#8b939e]"}`}>
                            <strong className={card.tone === "red" ? "font-semibold text-[#bd8a00]" : "font-semibold text-[#1a1a1a]"}>
                              {t(card.title)}:
                            </strong>{" "}
                            {t(card.body)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
                {section.note ? (
                  <p className="font-manrope mt-3 text-[13px] leading-5 text-[#8b939e]">{t(section.note)}</p>
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
