"use client";

import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { Markdown } from "@/components/ui/Markdown";
import { BlogCoverImage } from "./components/BlogCoverImage";
import type { BlogDetail } from "./schemas/blog.schema";
import { blogAuthorName, formatBlogDate } from "./utils/blog.utils";
import { BackLink } from "@/components/ui/BackLink";

type BlogDetailPageProps = {
  post: BlogDetail;
};

function ArticleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 text-[#9aa3ad]"
    >
      <rect
        x="2.25"
        y="1.75"
        width="11.5"
        height="12.5"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.7 5.2h6.6M4.7 8h6.6M4.7 10.8h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  const date = formatBlogDate(post.publishedAt);

  return (
    <div className="bg-white pb-20 pt-8 sm:pt-10">
      <Container>
        <article className="mx-auto w-full max-w-[760px]">
          <ScrollAnimatedElement animation="fade-in" duration={600}>
            <BackLink href="/blog">Back to Blogs</BackLink>
          </ScrollAnimatedElement>

          <ScrollAnimatedElement animation="slide-in-up" duration={600}>
            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f4f6f8] px-3 py-1.5 text-[13px] font-normal leading-none text-[#9aa3ad]">
              <ArticleIcon />
              <span>{blogAuthorName(post.authorName)}</span>
              {date ? (
                <>
                  <span aria-hidden="true">•</span>
                  <time dateTime={post.publishedAt ?? undefined}>{date}</time>
                </>
              ) : null}
            </p>

            <h1 className="mt-6 text-[32px] font-bold leading-[1.18] tracking-[-0.025em] text-[#1a1a1a] sm:text-[40px]">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-4 text-[15px] font-normal leading-[1.7] text-[#8b939e]">
                {post.excerpt}
              </p>
            ) : null}

            <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-[18px] bg-[#eef2f4]">
              <BlogCoverImage
                src={post.coverImage}
                alt={post.title}
                priority
                sizes="(max-width: 768px) 100vw, 760px"
                className="object-cover"
              />
            </div>

            {post.content.trim() ? (
              <Markdown className="mt-10 text-[15px] font-normal leading-[1.7] text-[#8b939e] sm:mt-12">
                {post.content}
              </Markdown>
            ) : null}
          </ScrollAnimatedElement>
        </article>
      </Container>
    </div>
  );
}
