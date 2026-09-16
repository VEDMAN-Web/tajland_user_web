import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactPage } from "../ContactPage";

describe("ContactPage", () => {
  it("renders the contact module heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { name: /get in touch/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
  });
});
