import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a native button", () => {
    render(<Button type="button">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders a link when href is provided", () => {
    render(<Button href="/explore">Explore Map</Button>);
    expect(screen.getByRole("link", { name: "Explore Map" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });
});
