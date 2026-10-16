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
  const post = await fetchBlogPost(blogId).catch(() => null);

  if (!post) {
    return createPageMetadata({
      title: "Blog",
      description: "Tajlandia stories and travel inspiration.",
      path: routes.blog,
    });
  }

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
