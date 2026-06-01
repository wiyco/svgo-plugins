import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const appDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@wiyco/svgo-plugin-hoist-stroke-width": resolve(
        appDir,
        "../../../packages/svgo-plugin-hoist-stroke-width/src/index.ts",
      ),
    },
  },
});
