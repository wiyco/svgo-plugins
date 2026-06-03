import { DashIcon, PlusIcon } from "@primer/octicons-react";
import { type ChangeEvent, memo, useCallback } from "react";

import { useSvgPlaygroundControlsContext } from "../SvgPlaygroundContext";

const formatNumberLabel = (value: number): string => {
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export const StrokeWidthControl = memo(function StrokeWidthControl() {
  const { rippleHandlers, setStrokeWidth, stepStrokeWidth, strokeWidth } =
    useSvgPlaygroundControlsContext();
  const handleDecreaseStrokeWidthClick = useCallback((): void => {
    stepStrokeWidth(-0.25);
  }, [stepStrokeWidth]);
  const handleIncreaseStrokeWidthClick = useCallback((): void => {
    stepStrokeWidth(0.25);
  }, [stepStrokeWidth]);
  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setStrokeWidth(Number(event.currentTarget.value));
    },
    [setStrokeWidth],
  );

  return (
    <section className="control-pod">
      <div className="control-pod-head">
        <label className="control-title" htmlFor="stroke-width-input">
          Stroke width
        </label>
        <output className="control-value">
          {formatNumberLabel(strokeWidth)}
        </output>
      </div>
      <div className="number-stepper">
        <button
          aria-label="Decrease stroke width"
          className="ripple-surface"
          type="button"
          onClick={handleDecreaseStrokeWidthClick}
          {...rippleHandlers}
        >
          <span aria-hidden="true" className="button-label button-icon">
            <DashIcon size={14} />
          </span>
        </button>
        <input
          aria-label="Stroke width"
          id="stroke-width-input"
          max="8"
          min="0.25"
          step="0.25"
          type="number"
          value={strokeWidth}
          onChange={handleStrokeWidthChange}
        />
        <button
          aria-label="Increase stroke width"
          className="ripple-surface"
          type="button"
          onClick={handleIncreaseStrokeWidthClick}
          {...rippleHandlers}
        >
          <span aria-hidden="true" className="button-label button-icon">
            <PlusIcon size={14} />
          </span>
        </button>
      </div>
    </section>
  );
});
