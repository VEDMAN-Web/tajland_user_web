import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { homePageContent } from "../data/home.mock";

describe("TestimonialsSection", () => {
  it("renders the featured quote and rating", () => {
    render(<TestimonialsSection content={homePageContent.testimonials} />);

    expect(
      screen.getByRole("heading", { name: /something worth trusting/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the map made thailand feel understandable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
  });

  it("renders nothing without testimonials", () => {
    const { container } = render(
      <TestimonialsSection
        content={{
          headingBefore: "Something worth",
          headingAccent: "trusting",
          items: [],
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
