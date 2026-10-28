import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders the brand, primary menu, and account actions", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: /tajlandia home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Explore Map" })).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "Get in Touch" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });

  it("renders Polish labels and prefixed links on /pl", () => {
    render(<SiteHeader locale="pl" />);

    expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute("href", "/pl/explore");
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/pl/contact");
    // Auth pages have no Polish version yet, so these stay unprefixed.
    expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute("href", "/");
  });

  it("links to the Polish version from the English header", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "PL" })).toHaveAttribute("href", "/pl");
  });
});
