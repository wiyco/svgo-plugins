import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*/vitest.config.ts",
      "apps/playground/vitest.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "apps/playground/src/**/*.{ts,tsx}",
      ],
      exclude: ["**/src/**/index.ts", "**/*.d.ts", "**/*.test.{ts,tsx}"],
      // Keep local coverage failures aligned with .octocov.yml.
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
