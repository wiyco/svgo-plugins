import type { SvgPreset } from "../model";

export type FloatingPresetKind =
  | "single-weight"
  | "multiple-weights"
  | "mixed-weights"
  | "generic";

type FloatingPresetPresentation = {
  kind: FloatingPresetKind;
  label: string;
};

const getFloatingPresetKind = (presetId: string): FloatingPresetKind => {
  switch (presetId) {
    case "single-weight":
      return "single-weight";
    case "multiple-weights":
      return "multiple-weights";
    case "mixed-weights":
      return "mixed-weights";
    default:
      return "generic";
  }
};

const getFloatingPresetLabel = (
  kind: FloatingPresetKind,
  fallbackLabel: string,
): string => {
  switch (kind) {
    case "single-weight":
      return "Single";
    case "multiple-weights":
      return "Multiple";
    case "mixed-weights":
      return "Mixed";
    default:
      return fallbackLabel;
  }
};

export const getFloatingPresetPresentation = (
  preset: Pick<SvgPreset, "id" | "label">,
): FloatingPresetPresentation => {
  const kind = getFloatingPresetKind(preset.id);

  return {
    kind,
    label: getFloatingPresetLabel(kind, preset.label),
  };
};
