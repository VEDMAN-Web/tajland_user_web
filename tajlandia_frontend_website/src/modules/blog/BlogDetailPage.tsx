'use client';

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import type { BlogPost } from "./blog.data";
import { getBlogPost } from "./blog.data";

type BlogDetailPageProps = {
  post: BlogPost;
};

function ArticleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#9aa3ad]">
      <rect x="2.25" y="1.75" width="11.5" height="12.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.7 5.2h6.6M4.7 8h6.6M4.7 10.8h4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  const relatedPosts = post.relatedSlugs
    .map((slug) => getBlogPost(slug))
    .filter((related): related is BlogPost => Boolean(related));

  return (
    <div className="bg-white pb-20 pt-8 sm:pt-10">
      <Container>
        <article className="mx-auto w-full max-w-[760px]">
          <ScrollAnimatedElement animation="fade-in" duration={600}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-[14px] font-normal text-[#9aa3ad] transition-colors hover:text-[#1c1c1c]">
              <span aria-hidden="true" className="text-[16px] leading-none">←</span>
              Back to Blogs
            </Link>
          </ScrollAnimatedElement>

          <ScrollAnimatedElement animation="slide-in-up" duration={600}>
            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f4f6f8] px-3 py-1.5 text-[13px] font-normal leading-none text-[#9aa3ad]">
              <ArticleIcon />
              <span>{post.author}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={post.date}>{post.date}</time>
            </p>

            <h1 className="mt-6 text-[32px] font-bold leading-[1.18] tracking-[-0.025em] text-[#1a1a1a] sm:text-[40px]">
              {post.title}
            </h1>
            <p className="mt-4 text-[15px] font-normal leading-[1.7] text-[#8b939e]">
              {post.description}
            </p>

            <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-[18px] bg-[#eef2f4]">
              <Image
                src={post.image}
                alt={post.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 760px"
                className="object-cover"
                style={{ objectPosition: post.imagePosition ?? "center" }}
              />
            </div>

            <div className="mt-10 space-y-8 sm:mt-12">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-[17px] font-semibold leading-snug text-[#1c1c1c] sm:text-[18px]">{section.heading}</h2>
                  <div className="mt-3 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-[15px] font-normal leading-[1.7] text-[#8b939e]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ScrollAnimatedElement>

          {relatedPosts.length > 0 ? (
            <ScrollAnimatedElement animation="fade-in" duration={600}>
              <section className="mt-14 border-t border-[#eef1f4] pt-8" aria-labelledby="related-articles">
                <h2 id="related-articles" className="text-[17px] font-semibold text-[#1c1c1c] sm:text-[18px]">Related stories</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {relatedPosts.map((related) => (
                    <Link key={related.slug} href={`/blog/${related.slug}`} className="group grid grid-cols-[112px_1fr] items-center gap-3">
                      <div className="relative aspect-[1.4] overflow-hidden rounded-[10px] bg-[#eef2f4]">
                        <Image src={related.image} alt={related.alt} fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      </div>
                      <h3 className="text-[15px] font-semibold leading-snug text-[#1c1c1c]">{related.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollAnimatedElement>
          ) : null}
        </article>
      </Container>
    </div>
  );
}
