import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogPage } from "../BlogPage";

describe("BlogPage", () => {
  it("renders the blog module heading", () => {
    render(<BlogPage />);
    expect(
      screen.getByRole("heading", { name: /blog is coming soon/i }),
    ).toBeInTheDocument();
  });
});
