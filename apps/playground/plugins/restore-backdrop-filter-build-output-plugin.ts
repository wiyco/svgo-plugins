import { type PluginOption } from "vite";

import { restoreBackdropFilterDeclarations } from "../src/build/restore-backdrop-filter-declarations";

/**
 * @see https://github.com/parcel-bundler/lightningcss/issues/695
 */
export const restoreBackdropFilterBuildOutputPlugin = (): PluginOption => {
  return {
    name: "restore-backdrop-filter-build-output",
    apply: "build",
    generateBundle(_options: unknown, bundle: Record<string, unknown>) {
      for (const output of Object.values(bundle)) {
        if (
          typeof output !== "object" ||
          output === null ||
          !("fileName" in output) ||
          !("type" in output) ||
          !("source" in output)
        ) {
          continue;
        }

        if (
          output.type !== "asset" ||
          typeof output.fileName !== "string" ||
          !output.fileName.endsWith(".css") ||
          typeof output.source !== "string"
        ) {
          continue;
        }

        output.source = restoreBackdropFilterDeclarations(output.source);
      }
    },
  };
};
