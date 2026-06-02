import { type ChangeEvent, memo, useCallback } from "react";

import { useSvgPlaygroundPanelsContext } from "../SvgPlaygroundContext";

export const InputPanel = memo(function InputPanel() {
  const { inputSvg, setSvg } = useSvgPlaygroundPanelsContext();
  const handleSvgChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      setSvg(event.currentTarget.value);
    },
    [setSvg],
  );

  return (
    <article className="panel panel-input">
      <div className="panel-header panel-header-inline">
        <h2>Input SVG</h2>
        <span className="status-pill">Editable</span>
      </div>
      <textarea
        aria-label="Input SVG"
        className="svg-textarea"
        spellCheck={false}
        value={inputSvg}
        onChange={handleSvgChange}
      />
    </article>
  );
});
