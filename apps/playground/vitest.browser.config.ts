import { playwright } from "@vitest/browser-playwright";
import { defineProject, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineProject({
    root: import.meta.dirname,
    test: {
      name: "playground-browser",
      include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
      browser: {
        api: {
          host: "127.0.0.1",
          port: 63315,
        },
        enabled: true,
        provider: playwright(),
        headless: true,
        screenshotFailures: false,
        instances: [
          {
            browser: "chromium",
          },
        ],
      },
    },
  }),
);
