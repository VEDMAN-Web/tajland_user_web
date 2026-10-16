import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { sortFaqs } = await import("../services/faq.api");

describe("sortFaqs", () => {
  it("orders by displayOrder and keeps API order on ties", () => {
    const item = (_id: string, displayOrder: number | null) => ({
      _id,
      question: _id,
      answer: "",
      displayOrder,
    });
    expect(
      sortFaqs([item("c", 2), item("a", 1), item("b", 1), item("d", null)]).map(
        (f) => f._id,
      ),
    ).toEqual(["a", "b", "c", "d"]);
  });
});
