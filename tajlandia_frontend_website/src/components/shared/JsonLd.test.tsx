import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("applies a CSP nonce and escapes HTML in structured data", () => {
    const { container } = render(
      <JsonLd data={{ name: "</script><script>alert(1)" }} nonce="abc123" />,
    );
    const script = container.querySelector("script");

    expect(script).toHaveAttribute("nonce", "abc123");
    expect(script?.innerHTML).toContain("\\u003c");
    expect(script?.innerHTML).not.toContain("</script>");
  });
});
