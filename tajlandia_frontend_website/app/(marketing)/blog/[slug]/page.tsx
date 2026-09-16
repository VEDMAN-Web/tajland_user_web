import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailPage, blogPosts, getBlogPost } from "@/modules/blog";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

type BlogDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return createPageMetadata({ title: "Blog", description: "Tajlandia stories and travel inspiration.", path: routes.blog });
  }

  return createPageMetadata({ title: post.title, description: post.description, path: `${routes.blog}/${post.slug}` });
}

export default async function Page({ params }: BlogDetailRouteProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogDetailPage post={post} />;
}
