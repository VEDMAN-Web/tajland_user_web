import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { BlogPost } from "./blog.data";
import { getBlogPost } from "./blog.data";

type BlogDetailPageProps = {
  post: BlogPost;
};

export function BlogDetailPage({ post }: BlogDetailPageProps) {
  const relatedPosts = post.relatedSlugs
    .map((slug) => getBlogPost(slug))
    .filter((related): related is BlogPost => Boolean(related));

  return (
    <main className="bg-white pb-20 pt-12 sm:pt-14">
      <Container className="max-w-5xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[14px] text-[#6f747b] transition-colors hover:text-navy">
          <span aria-hidden="true" className="text-lg leading-none">←</span>
          Back to Blogs
        </Link>

        <article className="mt-8 sm:mt-9">
          <div className="flex items-center gap-3 text-[14px] text-[#9ca5ae]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f7fb] text-navy" aria-hidden="true">✒</span>
            <span>{post.author}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.date}>{post.date}</time>
            <span className="hidden rounded-full bg-[#f4f7fb] px-3 py-1 text-[12px] text-navy sm:inline-block">{post.category}</span>
          </div>

          <h1 className="mt-7 max-w-[820px] text-[38px] font-medium leading-[1.08] tracking-[-0.035em] text-[#111827] sm:text-[52px]">{post.title}</h1>
          <p className="mt-6 max-w-[900px] text-[16px] leading-[1.45] text-[#252525] sm:text-[18px]">{post.description}</p>

          <div className="relative mt-10 aspect-[1.82] w-full overflow-hidden rounded-[16px] bg-[#eef2f4] sm:mt-11">
            <Image src={post.image} alt={post.alt} fill priority sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
          </div>

          <div className="mx-auto mt-12 max-w-[820px] space-y-10 text-[17px] leading-[1.65] text-[#444a51] sm:mt-14 sm:text-[18px]">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-4 text-[25px] font-medium leading-tight text-navy sm:text-[30px]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4 last:mb-0">{paragraph}</p>)}
              </section>
            ))}
          </div>
        </article>

        {relatedPosts.length > 0 ? (
          <section className="mt-16 border-t border-line pt-10 sm:mt-20" aria-labelledby="related-articles">
            <h2 id="related-articles" className="font-display text-[34px] text-navy">Related stories</h2>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              {relatedPosts.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group grid grid-cols-[130px_1fr] gap-4">
                  <div className="relative aspect-[1.35] overflow-hidden rounded-[10px] bg-[#eef2f4]">
                    <Image src={related.image} alt={related.alt} fill sizes="130px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9ca5ae]">{related.category}</p>
                    <h3 className="mt-1 text-[18px] font-medium leading-tight text-[#111827]">{related.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
