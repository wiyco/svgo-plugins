import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  SvgPreset,
} from "../../core/svg-playground/model";

import { createPlaygroundStateCodec } from "../../core/svg-playground/state/playground-state-codec";
import { HOIST_STROKE_WIDTH_PLAYGROUND_METADATA } from "./metadata";

export const SVG_PRESETS = [
  {
    id: "single-weight",
    label: "Single Weight",
    description:
      "One inherited stroke-width hoists cleanly from a group to the svg root.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3.5L18 5.75V11.25C18 14.8 15.6 18.02 12 19.75C8.4 18.02 6 14.8 6 11.25V5.75L12 3.5Z" />
    <path d="M9.5 11.9L11.25 13.65L14.85 10.05" />
  </g>
</svg>`,
  },
  {
    id: "multiple-weights",
    label: "Multiple Weights",
    description:
      "Matching descendant stroke-width declarations hoist into one svg root stroke-width.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 7.5H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M5 12H19" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
  <path d="M5 16.5H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>`,
  },
  {
    id: "mixed-weights",
    label: "Mixed Weights",
    description:
      "Conflicting descendant stroke widths stay on each element after optimization.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 7.5H19" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <path d="M5 16.5H19" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
</svg>`,
  },
  {
    id: "unsafe-script",
    label: "Unsafe Script",
    description: "Unsafe content disables optimization and live preview.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <script>alert("preview blocked")</script>
  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" />
</svg>`,
  },
] as const satisfies readonly SvgPreset[];

const DEFAULT_SVG_PRESET = SVG_PRESETS[0];

export const DEFAULT_QUERY_STATE = {
  svg: DEFAULT_SVG_PRESET.svg,
  color: "#155eef",
  size: 120,
  strokeWidth: 2,
} as const satisfies Readonly<PlaygroundQueryState>;

const playgroundStateCodec = createPlaygroundStateCodec(DEFAULT_QUERY_STATE);

export const hoistStrokeWidthPlayground = {
  defaultState: DEFAULT_QUERY_STATE,
  description:
    "Built from the shared apps/playground app and published at a slug-based URL. Paste SVG, swap presets, and inspect the full runtime pipeline from SVGO through live React preview.",
  eyebrow: "Package Playground",
  parseState: playgroundStateCodec.parse,
  presets: SVG_PRESETS,
  serializeState: playgroundStateCodec.serialize,
  slug: HOIST_STROKE_WIDTH_PLAYGROUND_METADATA.slug,
  summary: HOIST_STROKE_WIDTH_PLAYGROUND_METADATA.summary,
  title: HOIST_STROKE_WIDTH_PLAYGROUND_METADATA.title,
} as const satisfies Readonly<SvgPlaygroundDefinition>;
