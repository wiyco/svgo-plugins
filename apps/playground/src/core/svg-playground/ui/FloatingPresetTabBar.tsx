import { type MouseEvent, useCallback, useRef } from "react";

import type { SvgPreset } from "../model";

import { getFloatingPresetPresentation } from "./floating-preset-presentation";
import { useFloatingPresetSelectionStyle } from "./use-floating-preset-selection-style";
import { usePressRipple } from "./use-press-ripple";

type FloatingPresetTabBarProps = {
  activePresetId: string | null;
  presets: readonly SvgPreset[];
  selectPreset: (presetId: string) => void;
};

const renderFloatingPresetGlyph = (
  kind: ReturnType<typeof getFloatingPresetPresentation>["kind"],
) => {
  switch (kind) {
    case "single-weight":
      return (
        <svg
          aria-hidden="true"
          className="preset-button-glyph"
          viewBox="0 0 24 24"
        >
          <path d="M5 12H19" />
        </svg>
      );
    case "multiple-weights":
      return (
        <svg
          aria-hidden="true"
          className="preset-button-glyph"
          viewBox="0 0 24 24"
        >
          <path d="M5 7.25H19" />
          <path d="M5 12H19" />
          <path d="M5 16.75H19" />
        </svg>
      );
    case "mixed-weights":
      return (
        <svg
          aria-hidden="true"
          className="preset-button-glyph"
          viewBox="0 0 24 24"
        >
          <path d="M5 7.25H19" strokeWidth="1.2" />
          <path d="M5 12H19" strokeWidth="1.9" />
          <path d="M5 16.75H19" strokeWidth="2.7" />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden="true"
          className="preset-button-glyph"
          viewBox="0 0 24 24"
        >
          <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" />
          <path d="M8.25 12H15.75" />
          <path d="M12 8.25V15.75" className="preset-button-glyph-accent" />
        </svg>
      );
  }
};

export const FloatingPresetTabBar = (props: FloatingPresetTabBarProps) => {
  const { activePresetId, presets, selectPreset } = props;

  const rippleHandlers = usePressRipple();
  const presetTrackRef = useRef<HTMLDivElement | null>(null);
  const presetSelectionStyle = useFloatingPresetSelectionStyle({
    activePresetId,
    presets,
    presetTrackRef,
  });
  const handlePresetButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const presetId = event.currentTarget.dataset.presetId;

      if (presetId !== undefined) {
        selectPreset(presetId);
      }
    },
    [selectPreset],
  );

  return (
    <section className="floating-preset-tabbar" aria-label="Playground presets">
      <div className="floating-preset-tabbar-scroll">
        <div className="floating-preset-tabbar-track" ref={presetTrackRef}>
          {presetSelectionStyle !== null ? (
            <span
              aria-hidden="true"
              className="floating-preset-selection-indicator"
              style={presetSelectionStyle}
            />
          ) : null}
          {presets.map((preset) => {
            const presetPresentation = getFloatingPresetPresentation(preset);

            return (
              <button
                key={preset.id}
                aria-label={preset.label}
                aria-pressed={activePresetId === preset.id}
                className="preset-button floating-preset-button ripple-surface"
                data-preset-id={preset.id}
                title={preset.description}
                type="button"
                onClick={handlePresetButtonClick}
                {...rippleHandlers}
              >
                <span aria-hidden="true" className="preset-button-icon">
                  {renderFloatingPresetGlyph(presetPresentation.kind)}
                </span>
                <span className="button-label preset-button-label">
                  {presetPresentation.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
