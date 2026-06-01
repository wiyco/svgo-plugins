import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*/vitest.config.ts",
      "apps/playground/*/vitest.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "apps/playground/*/src/**/*.{ts,tsx}",
      ],
      exclude: ["**/src/**/index.ts", "**/*.d.ts"],
    },
  },
});
