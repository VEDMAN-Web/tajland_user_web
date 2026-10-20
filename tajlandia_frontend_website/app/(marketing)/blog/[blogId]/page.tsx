import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailPage, fetchBlogPost } from "@/modules/blog";
import { createPageMetadata } from "@/lib/seo/metadata";
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
    return createPageMetadata({
      title: "Blog",
      description: "Tajlandia stories and travel inspiration.",
      path: routes.blog,
    });
  }

  // No such article: the not-found page's title and robots tag, not the blog's.
  if (!post) notFound();

  return createPageMetadata({
    title: post.seo?.metaTitle || post.title,
    description:
      post.seo?.metaDescription ||
      post.excerpt ||
      "Tajlandia stories and travel inspiration.",
    path: `${routes.blog}/${post._id}`,
  });
}

export default async function Page({ params }: BlogDetailRouteProps) {
  const { blogId } = await params;
  const post = await fetchBlogPost(blogId);

  if (!post) {
    notFound();
  }

  return <BlogDetailPage post={post} />;
}
