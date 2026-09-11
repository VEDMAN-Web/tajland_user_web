import { describe, expect, it } from "vitest";
import { marketingModules } from "./registry";

describe("marketingModules", () => {
  it("lists independent modules in stable order", () => {
    expect(marketingModules).toEqual(["home", "explore-map", "blog", "contact"]);
  });
});
