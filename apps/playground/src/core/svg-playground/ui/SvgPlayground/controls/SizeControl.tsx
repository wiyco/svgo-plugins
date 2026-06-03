import { type CSSProperties, type ChangeEvent, memo, useCallback } from "react";

import { useSvgPlaygroundControlsContext } from "../SvgPlaygroundContext";

const MIN_SIZE = 64;
const MAX_SIZE = 320;

const getSizeSliderStyle = (size: number): CSSProperties => {
  const progress = ((size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * 100;

  return {
    ["--slider-progress" as const]: `${progress}%`,
  } as CSSProperties;
};

export const SizeControl = memo(function SizeControl() {
  const { setSize, size } = useSvgPlaygroundControlsContext();
  const handleSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setSize(Number(event.currentTarget.value));
    },
    [setSize],
  );

  return (
    <section className="control-pod">
      <div className="control-pod-head">
        <label className="control-title" htmlFor="size-input">
          Size
        </label>
        <output className="control-value">{Math.round(size)}px</output>
      </div>
      <input
        aria-label="Size"
        className="size-slider"
        id="size-input"
        max={MAX_SIZE}
        min={MIN_SIZE}
        style={getSizeSliderStyle(size)}
        step="4"
        type="range"
        value={size}
        onChange={handleSizeChange}
      />
    </section>
  );
});
