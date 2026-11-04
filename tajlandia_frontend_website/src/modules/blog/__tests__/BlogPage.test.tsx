import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogPage } from "../BlogPage";
import type { BlogListPage } from "../schemas/blog.schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../services/blog.service", () => ({ loadBlogPageAction: vi.fn() }));

function blogPage(count: number, totalPages = 1): BlogListPage {
  return {
    items: Array.from({ length: count }, (_, index) => ({
      _id: `507f1f77bcf86cd7994390${String(index).padStart(2, "0")}`,
      title: `Article ${index + 1}`,
      slug: `article-${index + 1}`,
      excerpt: "A short preview.",
      coverImage: null,
      publishedAt: "2026-10-10T07:00:00.000Z",
      authorName: "Alexander B.",
    })),
    pagination: { page: 1, limit: 6, total: count, totalPages },
  };
}

describe("BlogPage", () => {
  it("renders the articles from the API", () => {
    render(<BlogPage initialPage={blogPage(6)} />);
    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByRole("link", { name: /Article 1/ })).toHaveAttribute(
      "href",
      "/blog/507f1f77bcf86cd799439000",
    );
    expect(screen.queryByRole("button", { name: "Show More" })).not.toBeInTheDocument();
  });

  it("offers Show More while pages remain", () => {
    render(<BlogPage initialPage={blogPage(6, 2)} />);
    expect(screen.getByRole("button", { name: "Show More" })).toBeInTheDocument();
  });

  it("shows the empty and error states", () => {
    const { rerender } = render(<BlogPage initialPage={blogPage(0, 0)} />);
    expect(screen.getByText(/No articles yet/)).toBeInTheDocument();

    rerender(<BlogPage initialPage={null} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
