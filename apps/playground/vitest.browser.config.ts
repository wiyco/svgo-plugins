import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    root: import.meta.dirname,
    plugins: [
      {
        name: "playground-browser-test-app",
        enforce: "pre",
        configureServer(server) {
          server.middlewares.use((request, _response, next) => {
            // Serve the app under its own prefix because Vitest 5 uses / for
            // its tester iframe. Relative app navigation keeps this prefix.
            if (request.url?.startsWith("/__playground__/")) {
              const appPath = request.url.slice("/__playground__".length);
              request.url = appPath === "/" ? "/index.html" : appPath;
            }
            next();
          });
        },
      },
    ],
    test: {
      name: "playground-browser",
      include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
      api: {
        host: "127.0.0.1",
        port: 63315,
      },
      browser: {
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
