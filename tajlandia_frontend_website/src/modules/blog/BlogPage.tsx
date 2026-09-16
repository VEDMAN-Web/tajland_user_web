import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { blogPosts } from "./blog.data";

export function BlogPage() {
  return (
    <main className="min-h-[736px] bg-white pb-9 pt-14 sm:pt-20">
      <Container>
        <header className="text-center">
          <h1 className="font-display text-[40px] leading-none tracking-[-0.04em] text-navy sm:text-[52px]">Blog</h1>
          <p className="mx-auto mt-4 max-w-[470px] text-sm leading-6 text-muted">
            Everything you&apos;ve ever wanted to know about business insurance.
          </p>
        </header>

        <div className="mt-9 grid grid-cols-1 gap-x-[10px] gap-y-[18px] sm:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group flex min-w-0 flex-col">
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-[12px] bg-[#eef2f4]">
                <Image src={post.image} alt={post.alt} fill sizes="(max-width: 640px) 100vw, 227px" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
              <h2 className="mt-[14px] min-h-[57px] text-[24px] font-medium leading-[1.18] tracking-[-0.02em] text-[#111827]">{post.title}</h2>
              <p className="mt-2 min-h-[68px] text-[18px] leading-[1.25] text-[#c0c3c7]">{post.description}</p>
              <span className="mt-[13px] inline-block text-[18px] leading-none text-[#202020] underline underline-offset-2">View more</span>
              </Link>
            </article>
          ))}
        </div>

        <button type="button" className="mx-auto mt-[20px] block h-[56px] w-[158px] rounded-full bg-navy text-[18px] leading-none text-white shadow-[0_2px_5px_rgba(11,31,77,0.18)]">Show More</button>
      </Container>
    </main>
  );
}
