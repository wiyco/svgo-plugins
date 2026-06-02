import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useRef,
} from "react";

import type { SvgPreset } from "../model";

import { getFloatingPresetPresentation } from "./floating-preset-presentation";
import { useFloatingPresetSelectionStyle } from "./use-floating-preset-selection-style";
import { usePressRipple } from "./use-press-ripple";

type FloatingPresetTabBarProps = {
  activePresetId: string | null;
  presets: readonly SvgPreset[];
  selectPreset: (presetId: string) => void;
};

export const getNextPresetButton = ({
  currentTarget,
  key,
  presetTrack,
}: {
  currentTarget: HTMLButtonElement;
  key: string;
  presetTrack: ParentNode | null;
}): HTMLButtonElement | undefined => {
  if (presetTrack === null) {
    return undefined;
  }

  const presetButtons = Array.from(
    presetTrack.querySelectorAll<HTMLButtonElement>(".floating-preset-button"),
  );
  const currentIndex = presetButtons.indexOf(currentTarget);

  if (currentIndex < 0) {
    return undefined;
  }

  const nextIndex = (() => {
    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
        return Math.min(currentIndex + 1, presetButtons.length - 1);
      case "ArrowLeft":
      case "ArrowUp":
        return Math.max(currentIndex - 1, 0);
      case "Home":
        return 0;
      case "End":
        return presetButtons.length - 1;
      default:
        return null;
    }
  })();

  if (nextIndex === null) {
    return undefined;
  }

  return presetButtons[nextIndex];
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
  const handlePresetButtonFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>): void => {
      event.currentTarget.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    },
    [],
  );
  const handlePresetButtonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>): void => {
      rippleHandlers.onKeyDown?.(event);

      const nextPresetButton = getNextPresetButton({
        currentTarget: event.currentTarget,
        key: event.key,
        presetTrack: presetTrackRef.current,
      });

      if (nextPresetButton === undefined) {
        return;
      }

      event.preventDefault();
      nextPresetButton.focus();
    },
    [rippleHandlers],
  );

  return (
    <div
      aria-label="Playground presets"
      aria-orientation="horizontal"
      className="floating-preset-tabbar"
      role="toolbar"
    >
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
                onBlur={rippleHandlers.onBlur}
                onClick={handlePresetButtonClick}
                onFocus={handlePresetButtonFocus}
                onKeyDown={handlePresetButtonKeyDown}
                onPointerDown={rippleHandlers.onPointerDown}
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
    </div>
  );
};
