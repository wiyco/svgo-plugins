import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  SvgPreset,
} from "../../core/svg-playground/model";
import { createPlaygroundStateCodec } from "../../core/svg-playground/state/playground-state-codec";

export const SVG_PRESETS = [
  {
    id: "uniform-crosshair",
    label: "Uniform Crosshair",
    description:
      "Uniform descendant stroke widths hoist cleanly to the svg root.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4V8" />
    <path d="M12 16V20" />
    <path d="M4 12H8" />
    <path d="M16 12H20" />
  </g>
</svg>`,
  },
  {
    id: "mixed-weights",
    label: "Mixed Weights",
    description:
      "Different descendant stroke widths stay in place after optimization.",
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 19L12 5L19 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M9 14H15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
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

export const DEFAULT_QUERY_STATE: PlaygroundQueryState = {
  svg: DEFAULT_SVG_PRESET.svg,
  color: "#155eef",
  size: 184,
  strokeWidth: 2,
};

const playgroundStateCodec = createPlaygroundStateCodec(DEFAULT_QUERY_STATE);

export const hoistStrokeWidthPlayground: SvgPlaygroundDefinition = {
  defaultState: DEFAULT_QUERY_STATE,
  description:
    "Built from the shared apps/playground app and published at a slug-based URL. Paste SVG, swap presets, and inspect the full runtime pipeline from SVGO through live React preview.",
  eyebrow: "Package Playground",
  parseState: playgroundStateCodec.parse,
  presets: SVG_PRESETS,
  serializeState: playgroundStateCodec.serialize,
  slug: "svgo-plugin-hoist-stroke-width",
  summary:
    "Try the hoist-stroke-width plugin against raw SVG input and inspect the optimized output, generated React source, and live preview.",
  title: "SVGO plugin playground for hoisting stroke width",
};
