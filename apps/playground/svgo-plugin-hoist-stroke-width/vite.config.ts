import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { createPlaygroundPackageSourceAliases } from "../../../scripts/playground-package-source-alias.mjs";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: createPlaygroundPackageSourceAliases(import.meta.url, [
      "svgo-plugin-hoist-stroke-width",
    ]),
  },
});
