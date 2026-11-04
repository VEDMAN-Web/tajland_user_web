import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/JsonLd";
import { createBlogPostingJsonLd, createBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { BlogDetailPage, fetchBlogPost } from "@/modules/blog";
import { getPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

type BlogDetailRouteProps = {
  params: Promise<{ blogId: string }>;
};

export async function generateMetadata({
  params,
}: BlogDetailRouteProps): Promise<Metadata> {
  const { blogId } = await params;
  let post: Awaited<ReturnType<typeof fetchBlogPost>>;
  try {
    post = await fetchBlogPost(blogId);
  } catch {
    // The API failed (not a missing post): the page shows its own error, keep generic tags.
    return getPageMetadata({
      title: "Blog",
      description: "Tajlandia stories and travel inspiration.",
      path: routes.blog,
    });
  }

  // No such article: the not-found page's title and robots tag, not the blog's.
  if (!post) notFound();

  return getPageMetadata({
    title: post.seo?.metaTitle || post.title,
    description:
      post.seo?.metaDescription ||
      post.excerpt ||
      "Tajlandia stories and travel inspiration.",
    path: `${routes.blog}/${post._id}`,
    ...(post.coverImage && /^https?:\/\//i.test(post.coverImage)
      ? { image: { url: post.coverImage, alt: post.title } }
      : {}),
  });
}

export default async function Page({ params }: BlogDetailRouteProps) {
  const { blogId } = await params;
  const post = await fetchBlogPost(blogId);

  if (!post) {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const description = post.seo?.metaDescription || post.excerpt || undefined;

  return (
    <>
      <JsonLd
        data={createBlogPostingJsonLd({
          id: post._id,
          title: post.title,
          description,
          image: post.coverImage,
          authorName: post.authorName,
          publishedAt: post.publishedAt,
        })}
        nonce={nonce}
      />
      <JsonLd
        data={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: routes.blog },
          { name: post.title, path: `${routes.blog}/${post._id}` },
        ])}
        nonce={nonce}
      />
      <BlogDetailPage post={post} />
    </>
  );
}
