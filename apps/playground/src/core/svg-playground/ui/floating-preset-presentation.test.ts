import { describe, expect, it } from "vitest";

import { getFloatingPresetPresentation } from "./floating-preset-presentation";

describe("getFloatingPresetPresentation", () => {
  it("maps the known hoist-stroke-width presets to compact dock labels", () => {
    expect(
      getFloatingPresetPresentation({
        id: "single-weight",
        label: "Single Weight",
      }),
    ).toEqual({
      kind: "single-weight",
      label: "Single",
    });
    expect(
      getFloatingPresetPresentation({
        id: "multiple-weights",
        label: "Multiple Weights",
      }),
    ).toEqual({
      kind: "multiple-weights",
      label: "Multiple",
    });
    expect(
      getFloatingPresetPresentation({
        id: "mixed-weights",
        label: "Mixed Weights",
      }),
    ).toEqual({
      kind: "mixed-weights",
      label: "Mixed",
    });
  });

  it("falls back to the preset label for unknown preset ids", () => {
    expect(
      getFloatingPresetPresentation({
        id: "custom-safe-preset",
        label: "Custom Safe Preset",
      }),
    ).toEqual({
      kind: "generic",
      label: "Custom Safe Preset",
    });
  });
});
