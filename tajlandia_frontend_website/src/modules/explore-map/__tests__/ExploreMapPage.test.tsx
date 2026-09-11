import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExploreMapPage } from "../ExploreMapPage";

describe("ExploreMapPage", () => {
  it("renders the explore module heading", () => {
    render(<ExploreMapPage />);
    expect(
      screen.getByRole("heading", { name: /explore map is next/i }),
    ).toBeInTheDocument();
  });
});
