"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { Markdown } from "@/components/ui/Markdown";
import { routes } from "@/lib/constants/routes";
import { BlogCoverImage } from "./components/BlogCoverImage";
import type { BlogDetail } from "./schemas/blog.schema";
import { blogAuthorName, formatBlogDate } from "./utils/blog.utils";
import { BackLink } from "@/components/ui/BackLink";

type BlogDetailPageProps = {
  post: BlogDetail;
};

const WORDS_PER_MINUTE = 200;

function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <rect x="2" y="3" width="12" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Thin bar fixed to the top of the screen that fills as the article is read. */
function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const scrollable = root.scrollHeight - root.clientHeight;
      const progress = scrollable > 0 ? Math.min(1, root.scrollTop / scrollable) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        ref={barRef}
        style={{ transform: "scaleX(0)" }}
        className="h-full origin-left bg-linear-to-r from-navy to-[#e11d2e] will-change-transform"
      />
    </div>
  );
}

const SHOW_BACK_AFTER_PX = 320;

/**
 * "Back to Blogs" pill that slides in once the reader has scrolled past the top
 * link. Only on wide screens, where the empty left margin has room for it.
 */
function FloatingBackLink() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        wrapperRef.current.dataset.visible = String(window.scrollY > SHOW_BACK_AFTER_PX);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-visible="false"
      className="pointer-events-none fixed left-4 top-[112px] z-40 hidden translate-y-2 opacity-0 transition duration-300 data-[visible=true]:pointer-events-auto data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 xl:block xl:left-[calc(50%-580px)] motion-reduce:transition-none"
    >
      <BackLink href={routes.blog} className="shadow-[0_10px_24px_-12px_rgba(11,31,77,0.35)]">
        Back to Blogs
      </BackLink>
    </div>
  );
}

// Body typography. The shared <Markdown> is also used by the FAQ page, so the
// blog's reading styles are layered on from here instead of editing it.
const articleBodyClass = [
  "mt-10 text-[16px] font-normal leading-[1.85] text-[#475569] sm:mt-12 sm:text-[17px]",
  "[&>*+*]:mt-5",
  "[&_h1]:text-[26px] [&_h2]:text-[26px] [&_h1]:sm:text-[30px] [&_h2]:sm:text-[30px]",
  "[&_h1]:font-semibold [&_h2]:font-semibold [&_h1]:leading-[1.25] [&_h2]:leading-[1.25] [&_h1]:tracking-[-0.02em] [&_h2]:tracking-[-0.02em]",
  "[&_h1]:text-navy [&_h2]:text-navy",
  "[&_h3]:text-[21px] [&_h3]:font-semibold [&_h3]:leading-[1.3] [&_h3]:text-navy",
  "[&_h4]:text-[18px] [&_h4]:text-navy",
  "[&>:is(h1,h2,h3,h4,h5,h6):not(:first-child)]:mt-12 [&>:is(h1,h2,h3,h4,h5,h6)+*]:mt-4",
  "[&_strong]:text-[#0f172a]",
  "[&_ul]:space-y-2.5 [&_ol]:space-y-2.5 [&_ul]:marker:text-[#e11d2e] [&_ol]:marker:font-semibold [&_ol]:marker:text-navy",
  "[&_blockquote]:rounded-[16px] [&_blockquote]:border-l-4 [&_blockquote]:border-[#e11d2e] [&_blockquote]:bg-[#f6f8fc] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-[#334155]",
  "[&_a]:font-medium [&_a]:text-navy [&_a]:decoration-[#e11d2e]/60 [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a:hover]:decoration-[#e11d2e]",
  "[&_hr]:my-10 [&_hr]:border-[#e6eaf3]",
  "[&_code]:bg-[#eef3fb] [&_pre]:bg-[#f6f8fc]",
].join(" ");

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  const date = formatBlogDate(post.publishedAt);
  const author = blogAuthorName(post.authorName);
  const hasContent = Boolean(post.content.trim());
  const minutes = hasContent ? readingMinutes(post.content) : null;

  return (
    <div className="relative overflow-x-clip bg-white pb-20 pt-8 sm:pt-10">
      <ReadingProgress />
      <FloatingBackLink />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-linear-to-b from-[#eef3fb] via-[#f6f8fc] to-white">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e11d2e]/[0.06] blur-3xl" />
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-navy/[0.08] blur-3xl" />
      </div>
      <svg viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] w-full text-navy">
        <path d="M0 215 L80 150 L140 185 L235 100 L325 195 L415 135 L515 205 L620 120 L715 185 L800 150 V300 H0 Z" fill="currentColor" fillOpacity="0.035" />
        <path d="M0 245 L70 200 L130 228 L210 170 L300 235 L400 190 L500 240 L600 180 L700 232 L800 205 V300 H0 Z" fill="currentColor" fillOpacity="0.045" />
        <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244 V300 H0 Z" fill="currentColor" fillOpacity="0.06" />
        <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.2" />
      </svg>

      <Container className="relative">
        <article className="mx-auto w-full max-w-[980px]">
          <ScrollAnimatedElement animation="fade-in" duration={600}>
            <BackLink href={routes.blog}>Back to Blogs</BackLink>
          </ScrollAnimatedElement>

          <ScrollAnimatedElement animation="slide-in-up" duration={600}>
            <header className="mx-auto mt-8 max-w-[760px] text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] font-medium leading-none text-[#64748b]">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-[12px] font-semibold uppercase text-white">
                    {author.charAt(0)}
                  </span>
                  <span className="text-navy">{author}</span>
                </span>
                {date ? (
                  <>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c5cbd6]" />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon />
                      <time dateTime={post.publishedAt ?? undefined}>{date}</time>
                    </span>
                  </>
                ) : null}
                {minutes ? (
                  <>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c5cbd6]" />
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon />
                      {minutes} min read
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-6 font-[family-name:var(--font-playfair-display)] text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-navy sm:text-[50px]">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mx-auto mt-5 max-w-[680px] text-[16px] font-normal leading-[1.7] text-[#64748b] sm:text-[19px]">
                  {post.excerpt}
                </p>
              ) : null}
            </header>

            <div className="relative mx-auto mt-10 aspect-[2/1] w-full max-w-[820px] overflow-hidden rounded-[24px] bg-[#eef2f4] shadow-[0_30px_70px_-30px_rgba(11,31,77,0.45)] ring-1 ring-navy/10 sm:mt-12 sm:rounded-[32px]">
              <BlogCoverImage
                src={post.coverImage}
                alt={post.title}
                priority
                sizes="(max-width: 860px) 100vw, 820px"
                className="object-cover"
              />
            </div>

            {hasContent ? (
              <Markdown className={`mx-auto max-w-[720px] ${articleBodyClass}`}>
                {post.content}
              </Markdown>
            ) : null}

            <aside className="relative mx-auto mt-16 max-w-[720px] overflow-hidden rounded-[28px] bg-linear-to-br from-[#12307a] to-[#071536] px-6 py-9 text-center text-white shadow-[0_30px_60px_-30px_rgba(11,31,77,0.6)] sm:px-10 sm:py-11">
              <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[110px] w-full text-white">
                <path d="M0 120 V78 L50 40 L90 70 L150 20 L210 66 L260 34 L320 72 L400 44 V120 Z" fill="currentColor" fillOpacity="0.05" />
                <path d="M0 120 V96 L60 66 L110 88 L170 56 L240 90 L300 62 L360 92 L400 74 V120 Z" fill="currentColor" fillOpacity="0.07" />
              </svg>
              <p className="relative font-[family-name:var(--font-playfair-display)] text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[32px]">
                Ready to claim your little piece of Thailand?
              </p>
              <p className="relative mx-auto mt-3 max-w-[460px] text-[14px] leading-6 text-white/75 sm:text-[15px]">
                Explore. Choose. Claim. Make a memory yours.
              </p>
              <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={routes.explore}
                  className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-full bg-white px-7 text-[15px] font-medium text-navy shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] transition hover:-translate-y-px hover:bg-[#f5f7fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
                >
                  Explore the map
                </Link>
                <Link
                  href={routes.blog}
                  className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-full border border-white/30 px-7 text-[15px] font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
                >
                  More articles
                </Link>
              </div>
            </aside>
          </ScrollAnimatedElement>
        </article>
      </Container>
    </div>
  );
}
