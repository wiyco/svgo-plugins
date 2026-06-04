import { type PluginOption } from "vite";

import { preloadInitialFontBuildOutput } from "../src/build/preload-font-build-output";

export const preloadFontBuildOutputPlugin = (): PluginOption => {
  return {
    name: "preload-font-build-output",
    apply: "build",
    enforce: "post",
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
      preloadInitialFontBuildOutput(bundle);
    },
  };
};
