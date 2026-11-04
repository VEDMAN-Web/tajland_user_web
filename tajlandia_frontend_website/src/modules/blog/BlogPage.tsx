"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { BlogCoverImage } from "./components/BlogCoverImage";
import type { BlogListItem, BlogListPage } from "./schemas/blog.schema";
import { loadBlogPageAction } from "./services/blog.service";
import { blogAuthorName, blogHref, formatBlogDate } from "./utils/blog.utils";

type BlogPageProps = {
  /** First page, fetched on the server; null when the request failed. */
  initialPage: BlogListPage | null;
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <rect x="2" y="3" width="12" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <circle cx="8" cy="5.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 13.5c.6-2.4 2.6-3.6 5-3.6s4.4 1.2 5 3.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const primaryButtonClass =
  "inline-flex h-12 min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-[#12307a] to-navy px-8 text-[15px] font-medium leading-none text-white shadow-[0_10px_24px_-10px_rgba(11,31,77,0.7)] transition hover:-translate-y-px hover:shadow-[0_14px_28px_-10px_rgba(11,31,77,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none";

function Spinner() {
  return (
    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
  );
}

export function BlogPage({ initialPage }: BlogPageProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogListItem[]>(initialPage?.items ?? []);
  const [page, setPage] = useState(initialPage?.pagination.page ?? 1);
  const [totalPages, setTotalPages] = useState(initialPage?.pagination.totalPages ?? 0);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [isRetrying, startRetry] = useTransition();
  const hasMore = page < totalPages;

  const loadMore = () => {
    if (isLoadingMore) return;
    setLoadMoreError(null);
    startLoadingMore(async () => {
      const result = await loadBlogPageAction(page + 1);
      if (!result.ok) {
        setLoadMoreError(result.message);
        return;
      }
      setPosts((current) => {
        const seen = new Set(current.map((post) => post._id));
        return [...current, ...result.data.items.filter((post) => !seen.has(post._id))];
      });
      setPage(result.data.pagination.page);
      setTotalPages(result.data.pagination.totalPages);
    });
  };

  return (
    <main className="relative min-h-[736px] overflow-x-clip bg-white pb-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-linear-to-b from-[#eef3fb] via-[#f6f8fc] to-white">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-navy/[0.08] blur-3xl" />
      </div>

      <Container className="relative">
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <header className="pt-8 text-center sm:pt-10">
            <h1 className="font-[family-name:var(--font-playfair-display)] text-[44px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[60px]">
              Blog
            </h1>
            <p className="mx-auto mt-4 max-w-[300px] font-[family-name:var(--font-manrope)] text-[15px] font-normal leading-[1.6] text-[#64748b] sm:max-w-[520px] sm:text-[16px]">
              Stories, guides and inspiration for owning your little piece of Thailand.
            </p>
          </header>
        </ScrollAnimatedElement>

        {!initialPage ? (
          <div
            className="mx-auto mt-12 flex max-w-[420px] flex-col items-center rounded-[24px] border border-[#e6eaf3] bg-white px-6 py-10 text-center shadow-[0_24px_60px_-30px_rgba(11,31,77,0.25)]"
            role="alert"
          >
            <p className="font-[family-name:var(--font-manrope)] text-[15px] text-[#64748b]">
              We couldn&apos;t load the articles right now. Please try again.
            </p>
            <button
              type="button"
              disabled={isRetrying}
              className={`mt-6 ${primaryButtonClass}`}
              onClick={() => startRetry(() => router.refresh())}
            >
              {isRetrying ? (
                <>
                  <Spinner /> Loading...
                </>
              ) : (
                "Try again"
              )}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-center font-[family-name:var(--font-manrope)] text-[15px] text-[#64748b]">
            No articles yet. Check back soon.
          </p>
        ) : (
          <div className="mx-auto mt-8 grid max-w-[1160px] grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-8">
            {posts.map((post, index) => {
              const date = formatBlogDate(post.publishedAt);

              return (
                <article key={post._id} className="h-full">
                  <Link
                    href={blogHref(post)}
                    className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#e6eaf3] bg-white p-3 text-left shadow-[0_1px_2px_rgba(11,31,77,0.04)] transition duration-300 hover:-translate-y-1.5 hover:border-navy/15 hover:shadow-[0_28px_50px_-28px_rgba(11,31,77,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-[#eef2f4]">
                      <BlogCoverImage
                        src={post.coverImage}
                        alt={post.title}
                        priority={index < 3}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-[#071536]/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {date ? (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium leading-none text-navy shadow-[0_2px_8px_rgba(11,31,77,0.18)]">
                          <CalendarIcon />
                          {date}
                        </span>
                      ) : null}
                    </div>

                    <div className="relative flex flex-1 flex-col px-2 pb-2 pt-5">
                      <p className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-none text-[#8a99aa]">
                        <UserIcon />
                        {blogAuthorName(post.authorName)}
                      </p>
                      <h2 className="mt-3 line-clamp-2 text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#171717] transition-colors group-hover:text-navy sm:text-[20px]">
                        {post.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[1.55] text-[#64748b] sm:text-[15px]">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#e6e8ef] bg-white py-1 pl-4 pr-1 text-[13px] font-medium text-navy shadow-[0_1px_2px_rgba(11,31,77,0.06)] transition-colors group-hover:border-navy/25 group-hover:bg-[#f5f7fb]">
                          Read article
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f4f9] transition-colors group-hover:bg-navy group-hover:text-white">
                            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
                              <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {loadMoreError ? (
          <p className="mt-10 text-center text-[14px] text-[#E00C1B]" role="alert">
            {loadMoreError}
          </p>
        ) : null}

        {initialPage && hasMore ? (
          <button
            type="button"
            disabled={isLoadingMore}
            aria-busy={isLoadingMore}
            className={`mx-auto mt-12 ${primaryButtonClass}`}
            onClick={loadMore}
          >
            {isLoadingMore ? (
              <>
                <Spinner /> Loading...
              </>
            ) : (
              "Show More"
            )}
          </button>
        ) : null}
      </Container>
    </main>
  );
}
