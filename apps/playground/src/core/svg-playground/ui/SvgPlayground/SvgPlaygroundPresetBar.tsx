import { memo } from "react";

import { FloatingPresetTabBar } from "../FloatingPresetTabBar";
import { useSvgPlaygroundPresetContext } from "./SvgPlaygroundContext";

export const SvgPlaygroundPresetBar = memo(function SvgPlaygroundPresetBar() {
  const { activePresetId, presets, selectPreset } =
    useSvgPlaygroundPresetContext();

  return (
    <FloatingPresetTabBar
      activePresetId={activePresetId}
      presets={presets}
      selectPreset={selectPreset}
    />
  );
});
