import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../sections/HeroSection";
import { homePageContent } from "../data/home.mock";

describe("HeroSection", () => {
  it("renders only the full-bleed background image", () => {
    render(<HeroSection content={homePageContent.hero} />);

    expect(
      screen.getByRole("img", { name: homePageContent.hero.image?.alt ?? "" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/choose your plots/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("still renders when the image is missing", () => {
    render(
      <HeroSection
        content={{
          title: "Discover",
          titleAccent: "Thailand",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /discover thailand/i })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
