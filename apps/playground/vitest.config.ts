import { defineProject, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineProject({
    test: {
      name: "playground",
      environment: "happy-dom",
      exclude: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  }),
);
