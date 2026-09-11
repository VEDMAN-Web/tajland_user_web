import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleName = process.argv[2];

if (!moduleName || !/^[a-z][a-z0-9-]*$/.test(moduleName)) {
  console.error("Usage: npm run new-module -- <kebab-case-name>");
  process.exit(1);
}

const pascalName = moduleName
  .split("-")
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join("");
const pageName = `${pascalName}Page`;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleRoot = join(root, "src", "modules", moduleName);

if (existsSync(moduleRoot)) {
  console.error(`Module already exists: ${moduleName}`);
  process.exit(1);
}

const files = {
  "index.ts": `export { ${pageName} } from "./${pageName}";\n`,
  [`${pageName}.tsx`]: `export function ${pageName}() {
  return (
    <section>
      <h1>${pascalName}</h1>
    </section>
  );
}
`,
  [`__tests__/${pageName}.test.tsx`]: `import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ${pageName} } from "../${pageName}";

describe("${pageName}", () => {
  it("renders the module heading", () => {
    render(<${pageName} />);
    expect(screen.getByRole("heading", { name: "${pascalName}" })).toBeInTheDocument();
  });
});
`,
};

for (const [relativePath, contents] of Object.entries(files)) {
  const fullPath = join(moduleRoot, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, contents, "utf8");
}

console.log(`Created src/modules/${moduleName}`);
console.log(
  `Next: add a thin route in app/ that imports { ${pageName} } from "@/modules/${moduleName}"`,
);
