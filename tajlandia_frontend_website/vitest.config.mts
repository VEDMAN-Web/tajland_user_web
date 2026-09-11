import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "test/e2e/**"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/security/**",
        "src/lib/validation/**",
        "src/lib/seo/**",
        "src/lib/api/**",
        "src/modules/home/schemas/**",
        "src/modules/home/services/**",
        "src/modules/home/data/**",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
