import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapPreviewSection } from "../sections/MapPreviewSection";
import { homePageContent } from "../data/home.mock";

describe("MapPreviewSection", () => {
  it("renders the map heading and destination labels", () => {
    render(<MapPreviewSection content={homePageContent.map} />);

    expect(
      screen.getByRole("heading", { name: /a new way to experience thailand/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/interactive thailand map/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore map/i })).toHaveAttribute(
      "href",
      "/explore",
    );
  });
});
