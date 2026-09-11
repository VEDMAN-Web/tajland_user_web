import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./ExternalLink";

describe("ExternalLink", () => {
  it("renders a safe external link with opener protection", () => {
    render(<ExternalLink href="https://example.com/about">Docs</ExternalLink>);
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not render javascript URLs as links", () => {
    render(<ExternalLink href="javascript:alert(1)">Bad</ExternalLink>);
    expect(screen.queryByRole("link", { name: "Bad" })).not.toBeInTheDocument();
    expect(screen.getByText("Bad")).toBeInTheDocument();
  });
});
