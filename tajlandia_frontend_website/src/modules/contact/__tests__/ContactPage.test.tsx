import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactPage } from "../ContactPage";

describe("ContactPage", () => {
  it("renders the contact module heading", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { name: /contact is coming soon/i }),
    ).toBeInTheDocument();
  });
});
