import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

import { createPlaygroundPackageSourceAliases } from "../../scripts/playground-package-source-alias.mjs";

export default defineConfig({
  base: "./",
  build: {
    rolldownOptions: {
      input: {
        landing: resolve(import.meta.dirname, "index.html"),
        svgoPluginHoistStrokeWidth: resolve(
          import.meta.dirname,
          "svgo-plugin-hoist-stroke-width/index.html",
        ),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: createPlaygroundPackageSourceAliases(import.meta.url, [
      "svgo-plugin-hoist-stroke-width",
    ]),
  },
});
