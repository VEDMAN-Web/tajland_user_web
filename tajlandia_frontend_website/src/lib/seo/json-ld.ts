import { brand } from "@/lib/constants/brand";
import { contactDetails } from "@/lib/constants/contact";
import { getPublicEnv } from "@/lib/config/public-env";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { siteCopy } from "@/lib/i18n/messages";

function absoluteUrl(path: string): string {
  return new URL(path, getPublicEnv().NEXT_PUBLIC_SITE_URL).toString();
}

export function createWebsiteJsonLd(locale: Locale = "en") {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME } = getPublicEnv();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NEXT_PUBLIC_SITE_NAME,
    url: NEXT_PUBLIC_SITE_URL,
    inLanguage: locale,
    description: siteCopy[locale].description,
  };
}

/**
 * Who runs the site. Phone and email appear only when configured, so no
 * placeholder ever reaches search engines. Deliberately not a RealEstateAgent
 * or Product: the certificates are symbolic and must not read as property.
 */
export function createOrganizationJsonLd() {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME } = getPublicEnv();
  const contactPoint =
    contactDetails.email || contactDetails.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            ...(contactDetails.email ? { email: contactDetails.email } : {}),
            ...(contactDetails.phone ? { telephone: contactDetails.phone } : {}),
            availableLanguage: ["pl", "en"],
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: NEXT_PUBLIC_SITE_NAME,
    url: NEXT_PUBLIC_SITE_URL,
    logo: absoluteUrl(brand.logo.src),
    ...contactPoint,
  };
}

type BreadcrumbItem = { name: string; path: string };

export function createBreadcrumbJsonLd(items: BreadcrumbItem[], locale: Locale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizeHref(locale, item.path)),
    })),
  };
}

/** Markdown answers -> plain text for `acceptedAnswer.text`. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type FaqEntry = { question: string; answer: string };

export function createFaqJsonLd(items: FaqEntry[]) {
  const entries = items
    .map((item) => ({ question: item.question.trim(), answer: markdownToPlainText(item.answer) }))
    .filter((item) => item.question && item.answer);

  if (entries.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

type BlogPostInput = {
  id: string;
  title: string;
  description?: string;
  image?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
};

export function createBlogPostingJsonLd(post: BlogPostInput) {
  const { NEXT_PUBLIC_SITE_NAME } = getPublicEnv();
  const url = absoluteUrl(`/blog/${post.id}`);
  const image = post.image && /^https?:\/\//i.test(post.image) ? post.image : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    mainEntityOfPage: url,
    url,
    ...(post.description ? { description: post.description } : {}),
    ...(image ? { image } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    author: { "@type": post.authorName ? "Person" : "Organization", name: post.authorName || NEXT_PUBLIC_SITE_NAME },
    publisher: { "@type": "Organization", name: NEXT_PUBLIC_SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl(brand.logo.src) } },
  };
}
