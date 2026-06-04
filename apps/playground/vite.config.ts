import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

import { createPlaygroundPackageSourceAliases } from "../../scripts/playground-package-source-alias.mjs";
import { preloadFontBuildOutputPlugin } from "./plugins/preload-font-build-output-plugin";
import { restoreBackdropFilterBuildOutputPlugin } from "./plugins/restore-backdrop-filter-build-output-plugin";

const shouldPreloadInitialFont = process.env.SVGO_PRELOAD_INITIAL_FONT !== "0";

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
  optimizeDeps: {
    include: ["svgo/browser"],
  },
  plugins: [
    react(),
    ...(shouldPreloadInitialFont ? [preloadFontBuildOutputPlugin()] : []),
    restoreBackdropFilterBuildOutputPlugin(),
  ],
  resolve: {
    alias: createPlaygroundPackageSourceAliases(import.meta.url, [
      "svgo-plugin-hoist-stroke-width",
    ]),
  },
});
