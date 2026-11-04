import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { homePageContent } from "../data/home.mock";

describe("TestimonialsSection", () => {
  it("renders the featured quote and rating", () => {
    render(<TestimonialsSection content={homePageContent.testimonials} />);

    expect(
      screen.getByRole("heading", { name: /something worth keeping/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a digital keepsake, issued the moment you claim your fragment/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get yours/i })).toBeInTheDocument();
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
