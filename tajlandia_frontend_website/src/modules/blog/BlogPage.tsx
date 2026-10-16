"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { BlogCoverImage } from "./components/BlogCoverImage";
import type { BlogListItem, BlogListPage } from "./schemas/blog.schema";
import { loadBlogPageAction } from "./services/blog.service";
import { blogHref } from "./utils/blog.utils";

type BlogPageProps = {
  /** First page, fetched on the server; null when the request failed. */
  initialPage: BlogListPage | null;
};

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
    <main className="min-h-[736px] bg-white pb-16 pt-14 sm:pt-16">
      <Container>
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <header className="text-center">
            <h1 className="font-[family-name:var(--font-playfair-display)] text-[44px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[52px]">
              Blog
            </h1>
            <p className="mx-auto mt-3 max-w-[280px] font-[family-name:var(--font-manrope)] text-[15px] font-normal leading-[1.55] text-[#8a99aa] sm:max-w-none">
              Everything you&apos;ve ever wanted to know about
              <br className="hidden sm:block" /> business insurance.
            </p>
          </header>
        </ScrollAnimatedElement>

        {!initialPage ? (
          <div
            className="mx-auto mt-12 flex max-w-[420px] flex-col items-center text-center"
            role="alert"
          >
            <p className="font-[family-name:var(--font-manrope)] text-[15px] text-[#8a99aa]">
              We couldn&apos;t load the articles right now. Please try again.
            </p>
            <button
              type="button"
              disabled={isRetrying}
              className="mt-6 h-12 min-w-[148px] rounded-full bg-navy px-8 text-[16px] font-medium leading-none text-white disabled:opacity-70"
              onClick={() => startRetry(() => router.refresh())}
            >
              {isRetrying ? "Loading..." : "Try again"}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-center font-[family-name:var(--font-manrope)] text-[15px] text-[#8a99aa]">
            No articles yet. Check back soon.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-[1120px] grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article key={post._id}>
                <Link
                  href={blogHref(post)}
                  className="group flex min-w-0 flex-col text-left"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-[#eef2f4]">
                    <BlogCoverImage
                      src={post.coverImage}
                      alt={post.title}
                      priority={index < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#171717] sm:text-[20px]">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 h-[2.9em] font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[1.45] text-[#8a99aa] sm:text-[15px]">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-block text-[15px] font-medium leading-none text-[#1a1a1a] underline underline-offset-2">
                    View more
                  </span>
                </Link>
              </article>
            ))}
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
            className="mx-auto mt-12 block h-12 min-w-[148px] rounded-full bg-navy px-8 text-[16px] font-medium leading-none text-white disabled:opacity-70"
            onClick={loadMore}
          >
            {isLoadingMore ? "Loading..." : "Show More"}
          </button>
        ) : null}
      </Container>
    </main>
  );
}
