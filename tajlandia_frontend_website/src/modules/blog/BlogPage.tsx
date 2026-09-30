'use client';

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { blogPosts } from "./blog.data";

const INITIAL_BLOG_COUNT = 6;

export function BlogPage() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BLOG_COUNT);
  const visiblePosts = blogPosts.slice(0, visibleCount);
  const hasMore = visibleCount < blogPosts.length;
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

        <div className="mx-auto mt-10 grid max-w-[1120px] grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {visiblePosts.map((post, index) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group flex min-w-0 flex-col text-left">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-[#eef2f4]">
                  <img
                    src={post.image}
                    alt={post.alt}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <h2 className="mt-4 line-clamp-2 text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#171717] sm:text-[20px]">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 h-[2.9em] font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[1.45] text-[#8a99aa] sm:text-[15px]">
                  {post.description}
                </p>
                <span className="mt-3 inline-block text-[15px] font-medium leading-none text-[#1a1a1a] underline underline-offset-2">View more</span>
              </Link>
            </article>
          ))}
        </div>

        {hasMore ? (
          <button
            type="button"
            className="mx-auto mt-12 block h-12 min-w-[148px] rounded-full bg-navy px-8 text-[16px] font-medium leading-none text-white"
            onClick={() => setVisibleCount(blogPosts.length)}
          >
            Show More
          </button>
        ) : null}
      </Container>
    </main>
  );
}
