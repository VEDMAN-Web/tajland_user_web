import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CtaSection } from "../sections/CtaSection";
import { homePageContent } from "../data/home.mock";

describe("CtaSection", () => {
  it("renders the promotional heading and link", () => {
    render(<CtaSection content={homePageContent.cta} />);

    expect(
      screen.getByRole("heading", { name: homePageContent.cta.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: homePageContent.cta.cta?.label }),
    ).toHaveAttribute("href", "/explore");
  });
});
