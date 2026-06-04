import type { PlaygroundCatalogEntry } from "../catalog-entry";

export const HOIST_STROKE_WIDTH_PLAYGROUND_METADATA = {
  packageName: "@wiyco/svgo-plugin-hoist-stroke-width",
  presetCount: 3,
  slug: "svgo-plugin-hoist-stroke-width",
  summary:
    "Move uniform descendant stroke-width values to the root SVG element so SVGR-generated React icons can override them from props or CSS.",
  title: "Hoist Stroke Width",
} as const satisfies PlaygroundCatalogEntry;
