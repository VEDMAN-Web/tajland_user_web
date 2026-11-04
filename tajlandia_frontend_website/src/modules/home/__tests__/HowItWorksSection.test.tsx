import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HowItWorksSection } from "../sections/HowItWorksSection";
import { homePageContent } from "../data/home.mock";

describe("HowItWorksSection", () => {
  it("renders every step", () => {
    render(<HowItWorksSection content={homePageContent.howItWorks} />);

    expect(
      screen.getByRole("heading", { name: homePageContent.howItWorks.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /navigate the map/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /receive certificate/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing when there are no steps", () => {
    const { container } = render(
      <HowItWorksSection content={{ heading: "How it Works", steps: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
