import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureSection } from "../sections/FeatureSection";
import { homePageContent } from "../data/home.mock";

describe("FeatureSection", () => {
  it("renders the feature heading and cards", () => {
    render(<FeatureSection content={homePageContent.features} />);

    expect(
      screen.getByRole("heading", { name: homePageContent.features.heading }),
    ).toBeInTheDocument();
    // The subtitle is split across a <br>, so compare the paragraph text without whitespace.
    const subtitle = (homePageContent.features.subtitle as string).replace(/\s+/g, "");
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" && element.textContent?.replace(/\s+/g, "") === subtitle,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore map/i })).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(screen.getByRole("link", { name: /my purchases/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /gift a plot/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("renders nothing when there are no active cards", () => {
    const { container } = render(
      <FeatureSection content={{ heading: "Empty", items: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
