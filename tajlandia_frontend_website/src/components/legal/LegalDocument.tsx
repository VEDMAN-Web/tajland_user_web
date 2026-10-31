import Link from "next/link";
import { Markdown } from "@/components/ui/Markdown";

/** A legal page as `GET /page/legal-pages/{id}` sends it (only what the page shows). */
export type LegalDocumentData = {
  title: string;
  description?: string | null;
  /** Markdown from the admin editor. */
  content: string;
  version?: string | null;
  effectiveDate?: string | null;
  jurisdiction?: string | null;
};

/** The page's own words, so a language switch (the dashboard) can translate them. */
export type LegalDocumentLabels = {
  legalDocumentation: string;
  tableOfContents: string;
  sections: string;
  noContent: string;
};

const DEFAULT_LABELS: LegalDocumentLabels = {
  legalDocumentation: "Legal Documentation",
  tableOfContents: "Table of Contents",
  sections: "Sections",
  noContent: "This document has no content yet.",
};

type LegalDocumentProps = {
  page: LegalDocumentData;
  /** Inside the dashboard (account pages) instead of the public site. */
  embedded?: boolean;
  labels?: LegalDocumentLabels;
};

type LegalSection = { title: string; body: string };

/** `2026-10-31T00:00:00.000Z` → `Oct 31, 2026`. */
function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The editor's Markdown as numbered sections: every `## Heading` opens one, and
 * whatever comes before the first heading is the intro.
 */
function splitSections(content: string): { intro: string; sections: LegalSection[] } {
  const sections: LegalSection[] = [];
  const intro: string[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;

  const close = () => {
    if (current) sections.push({ title: current.title, body: current.lines.join("\n").trim() });
  };

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = inFence ? null : /^##\s+(.+?)\s*#*\s*$/.exec(line);

    if (heading) {
      close();
      current = { title: heading[1] ?? "", lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }
  close();

  return { intro: intro.join("\n").trim(), sections };
}

// Section text as in the design: grey 14px body, and a "> note" shown as the amber callout.
const bodyClass = [
  "text-[14px] leading-6 text-[#8b939e]",
  "[&_strong]:font-semibold [&_strong]:text-[#1a1a1a]",
  "[&_ul]:space-y-2 [&_ol]:space-y-2",
  "[&_blockquote]:rounded-[12px] [&_blockquote]:border [&_blockquote]:border-[#ead7a2] [&_blockquote]:bg-[#fffdf6] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-[13px] [&_blockquote]:leading-5 [&_blockquote]:not-italic [&_blockquote]:text-[#9a7430]",
  "[&_blockquote_strong]:text-[#8a6420]",
  "[&_a]:text-navy",
].join(" ");

/**
 * A legal document (Terms, Privacy Policy, ...) from the legal pages API: title, a
 * table of contents and numbered sections. Used on the public site and in the dashboard.
 */
export function LegalDocument({ page, embedded = false, labels = DEFAULT_LABELS }: LegalDocumentProps) {
  const { intro, sections } = splitSections(page.content);
  const effective = formatDate(page.effectiveDate);
  const details = [
    page.version ? `Version ${page.version}` : null,
    effective ? `Effective ${effective}` : null,
    page.jurisdiction,
  ].filter(Boolean);

  return (
    <div className={`bg-[#f7f9fc] text-navy ${embedded ? "min-h-[100svh]" : ""}`}>
      <main
        className={
          embedded
            ? "w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-auto lg:[&>section]:w-full lg:[&>section]:px-10 lg:[&>section]:py-8"
            : "mx-auto w-full max-w-[1180px] px-5 pb-16 pt-10 sm:px-8 lg:pt-8"
        }
      >
        <section className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                {page.title}
              </h1>
              {page.description ? (
                <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">{page.description}</p>
              ) : null}
              {details.length ? (
                <p className="font-manrope mt-1 text-[12px] leading-5 text-[#a3aab3]">{details.join(" · ")}</p>
              ) : null}
            </div>
            <p className="mt-1 flex shrink-0 items-center gap-1.5 font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-navy">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e11d2e]" />
              {labels.legalDocumentation}
            </p>
          </div>

          {sections.length ? (
            <nav
              aria-label={labels.tableOfContents}
              className="mt-5 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-manrope flex items-center gap-2 text-[14px] font-semibold leading-5 text-[#1a1a1a]">
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 text-[#66717c]">
                    <path d="M3 4h10M3 8h10M3 12h7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {labels.tableOfContents}
                </h2>
                <span className="font-manrope text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b939e]">
                  {sections.length} {labels.sections}
                </span>
              </div>
              <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {sections.map((section, index) => (
                  <Link
                    key={`${section.title}-${index}`}
                    href={`#section-${index + 1}`}
                    className="flex min-w-0 items-center gap-2 font-manrope text-[13px] leading-5 text-[#66717c] hover:text-navy"
                  >
                    <span className="w-5 shrink-0 font-semibold text-[#1a1a1a]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate">{section.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}

          <div className="mt-6 grid gap-7">
            {intro ? <Markdown className={`font-manrope ${bodyClass}`}>{intro}</Markdown> : null}

            {sections.map((section, index) => (
              <article id={`section-${index + 1}`} key={`${section.title}-${index}`} className="scroll-mt-24">
                <h2 className="font-manrope flex items-center gap-2.5 text-[18px] font-semibold leading-6 text-[#1a1a1a]">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] bg-[#1a1a1a] font-manrope text-[10px] font-semibold leading-none text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                {section.body ? (
                  <Markdown className={`mt-2 font-manrope ${bodyClass}`}>{section.body}</Markdown>
                ) : null}
              </article>
            ))}

            {!intro && !sections.length ? (
              <p className="font-manrope text-[14px] leading-6 text-[#8b939e]">{labels.noContent}</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
