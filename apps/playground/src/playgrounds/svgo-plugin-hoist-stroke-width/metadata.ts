import type { PlaygroundCatalogEntry } from "../catalog-entry";

export const HOIST_STROKE_WIDTH_PLAYGROUND_METADATA = {
  packageName: "@wiyco/svgo-plugin-hoist-stroke-width",
  presetCount: 3,
  slug: "svgo-plugin-hoist-stroke-width",
  summary:
    "Try the hoist-stroke-width plugin against raw SVG input and inspect the optimized output, generated React source, and live preview.",
  title: "SVGO plugin playground for hoisting stroke width",
} as const satisfies PlaygroundCatalogEntry;
