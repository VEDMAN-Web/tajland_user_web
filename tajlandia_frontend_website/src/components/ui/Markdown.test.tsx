import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown, safeMarkdownUrl } from "./Markdown";

describe("Markdown", () => {
  it("keeps safe links and drops script URLs", () => {
    expect(safeMarkdownUrl("https://tajlandia.com")).toBe("https://tajlandia.com");
    expect(safeMarkdownUrl("/blog")).toBe("/blog");
    expect(safeMarkdownUrl("javascript:alert(1)")).toBe("");
    expect(safeMarkdownUrl("//evil.com")).toBe("");
  });

  it("does not render raw HTML", () => {
    const { container } = render(
      <Markdown>{"Hi <script>alert(1)</script> <b>x</b>"}</Markdown>,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
  });

  it("renders headings and paragraphs", () => {
    render(<Markdown>{"## Coastline\r\n\r\nBody text."}</Markdown>);
    expect(screen.getByRole("heading", { name: "Coastline" })).toBeInTheDocument();
    expect(screen.getByText("Body text.").tagName).toBe("P");
  });
});
