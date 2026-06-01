import type { PlaygroundQueryState } from "./types";

export type SvgPreset = {
  description: string;
  id: string;
  label: string;
  svg: string;
};

export const SVG_PRESETS: SvgPreset[] = [
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
];

export const DEFAULT_QUERY_STATE: PlaygroundQueryState = {
  svg: SVG_PRESETS[0]?.svg ?? "",
  color: "#155eef",
  size: 184,
  strokeWidth: 2,
};

export const findPresetById = (presetId: string): SvgPreset | null => {
  return (
    SVG_PRESETS.find((preset) => {
      return preset.id === presetId;
    }) ?? null
  );
};

export const getPresetIdForSvg = (svg: string): string | null => {
  return (
    SVG_PRESETS.find((preset) => {
      return preset.svg === svg;
    })?.id ?? null
  );
};
