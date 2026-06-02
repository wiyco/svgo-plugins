import {
  type CSSProperties,
  type RefObject,
  useLayoutEffect,
  useState,
} from "react";

import type { SvgPreset } from "../model";

type FloatingPresetSelectionStyle = CSSProperties & {
  "--floating-preset-selection-height": string;
  "--floating-preset-selection-width": string;
  "--floating-preset-selection-x": string;
  "--floating-preset-selection-y": string;
};

type MeasurablePresetButton = Pick<
  HTMLButtonElement,
  "offsetHeight" | "offsetLeft" | "offsetTop" | "offsetWidth"
>;

type UseFloatingPresetSelectionStyleOptions = {
  activePresetId: string | null;
  presets: readonly SvgPreset[];
  presetTrackRef: RefObject<HTMLDivElement | null>;
};

const getFloatingPresetSelectionStyle = (
  button: MeasurablePresetButton,
): FloatingPresetSelectionStyle => {
  return {
    "--floating-preset-selection-height": `${button.offsetHeight}px`,
    "--floating-preset-selection-width": `${button.offsetWidth}px`,
    "--floating-preset-selection-x": `${button.offsetLeft}px`,
    "--floating-preset-selection-y": `${button.offsetTop}px`,
  };
};

const hasMatchingFloatingPresetSelectionStyle = (
  currentStyle: FloatingPresetSelectionStyle | null,
  nextStyle: FloatingPresetSelectionStyle,
): boolean => {
  return (
    currentStyle !== null &&
    currentStyle["--floating-preset-selection-height"] ===
      nextStyle["--floating-preset-selection-height"] &&
    currentStyle["--floating-preset-selection-width"] ===
      nextStyle["--floating-preset-selection-width"] &&
    currentStyle["--floating-preset-selection-x"] ===
      nextStyle["--floating-preset-selection-x"] &&
    currentStyle["--floating-preset-selection-y"] ===
      nextStyle["--floating-preset-selection-y"]
  );
};

const findFloatingPresetButton = (
  track: HTMLDivElement,
  activePresetId: string,
): HTMLButtonElement | null => {
  return (
    Array.from(
      track.querySelectorAll<HTMLButtonElement>("button[data-preset-id]"),
    ).find((button) => {
      return button.dataset.presetId === activePresetId;
    }) ?? null
  );
};

export const useFloatingPresetSelectionStyle = (
  options: UseFloatingPresetSelectionStyleOptions,
): FloatingPresetSelectionStyle | null => {
  const { activePresetId, presets, presetTrackRef } = options;

  const [presetSelectionStyle, setPresetSelectionStyle] =
    useState<FloatingPresetSelectionStyle | null>(null);

  useLayoutEffect(() => {
    const track = presetTrackRef.current;

    if (track === null || activePresetId === null) {
      setPresetSelectionStyle(null);
      return;
    }

    const activeButton = findFloatingPresetButton(track, activePresetId);

    if (activeButton === null) {
      setPresetSelectionStyle(null);
      return;
    }

    const updatePresetSelectionStyle = () => {
      const nextStyle = getFloatingPresetSelectionStyle(activeButton);

      setPresetSelectionStyle((currentStyle) => {
        if (hasMatchingFloatingPresetSelectionStyle(currentStyle, nextStyle)) {
          return currentStyle;
        }

        return nextStyle;
      });
    };

    updatePresetSelectionStyle();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePresetSelectionStyle();
    });

    resizeObserver.observe(track);
    resizeObserver.observe(activeButton);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activePresetId, presetTrackRef, presets]);

  return presetSelectionStyle;
};
