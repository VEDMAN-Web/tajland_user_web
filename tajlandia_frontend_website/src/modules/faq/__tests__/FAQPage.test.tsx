import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FAQPage } from "../FAQPage";
import type { FaqItem } from "../schemas/faq.schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const faqs: FaqItem[] = [
  {
    _id: "a",
    question: "Can I transfer my plot?",
    answer:
      "Yes, to a registered **user**.\n\n- Go to *My **Plots***\n\nThe old one becomes ~~valid~~ inactive.\n\n> Transfers cannot be undone.",
    displayOrder: 1,
  },
  { _id: "b", question: "What do I get?", answer: "A certificate.", displayOrder: 2 },
];

describe("FAQPage", () => {
  it("opens the first answer and renders its Markdown", () => {
    const { container } = render(<FAQPage faqs={faqs} />);

    expect(
      screen.getByRole("button", { name: /Can I transfer my plot/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("user").tagName).toBe("STRONG");
    expect(screen.getByText("Plots").closest("em")).not.toBeNull();
    expect(screen.getByText("valid").tagName).toBe("DEL");
    expect(container.querySelector("blockquote")).toHaveTextContent(
      "Transfers cannot be undone.",
    );
    expect(screen.queryByText("A certificate.")).not.toBeInTheDocument();
  });

  it("switches the open answer", () => {
    render(<FAQPage faqs={faqs} />);
    fireEvent.click(screen.getByRole("button", { name: /What do I get/ }));
    expect(screen.getByText("A certificate.")).toBeInTheDocument();
  });

  it("shows the empty and error states", () => {
    const { rerender } = render(<FAQPage faqs={[]} />);
    expect(screen.getByText(/No questions yet/)).toBeInTheDocument();

    rerender(<FAQPage faqs={null} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
