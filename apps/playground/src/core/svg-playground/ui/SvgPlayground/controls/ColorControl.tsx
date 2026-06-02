import { type ChangeEvent, memo, useCallback } from "react";

import { useSvgPlaygroundControlsContext } from "../SvgPlaygroundContext";

export const ColorControl = memo(function ColorControl() {
  const { color, setColor } = useSvgPlaygroundControlsContext();
  const handleColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setColor(event.currentTarget.value);
    },
    [setColor],
  );

  return (
    <section className="control-pod">
      <div className="control-pod-head">
        <label className="control-title" htmlFor="color-input">
          color
        </label>
        <code className="control-value">{color}</code>
      </div>
      <div className="color-swatch-row">
        <input
          aria-label="color"
          id="color-input"
          type="color"
          value={color}
          onChange={handleColorChange}
        />
      </div>
    </section>
  );
});
