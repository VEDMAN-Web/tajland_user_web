import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../sections/HeroSection";
import { homePageContent } from "../data/home.mock";

describe("HeroSection", () => {
  it("renders only the full-bleed background image", () => {
    render(<HeroSection content={{ ...homePageContent.hero, film: undefined }} />);

    expect(
      screen.getByRole("img", { name: homePageContent.hero.image?.alt ?? "" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/choose your plots/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the scroll film with the heading and story blocks", () => {
    const { container } = render(<HeroSection content={homePageContent.hero} />);
    const story = homePageContent.hero.story ?? [];

    expect(
      screen.getByRole("heading", { level: 1, name: /claim your little piece of thailand/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: homePageContent.hero.film?.poster.alt ?? "" }),
    ).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-film-block]")).toHaveLength(story.length);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(story.length);
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
