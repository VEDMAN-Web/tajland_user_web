import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const moduleInternals = {
  group: ["@/modules/*/*", "@/modules/*/**"],
  message: "Import feature modules through their public API (@/modules/<name>).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    ignores: ["src/modules/registry.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/modules/*/*", "@/modules/*/**"],
              message:
                "Feature modules cannot import other modules. Use relative imports inside a module, and move shared code to components/ or lib/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [moduleInternals] }],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules", "@/modules/*", "@/modules/*/*", "@/modules/*/**"],
              message: "Shared UI cannot import feature modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules",
                "@/modules/*",
                "@/modules/*/*",
                "@/modules/*/**",
                "@/components",
                "@/components/*",
                "@/components/*/*",
                "@/components/*/**",
              ],
              message: "Infrastructure cannot import modules or UI components.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
