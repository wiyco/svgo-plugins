import { memo, useCallback } from "react";

import { useSvgPlaygroundInputPanelContext } from "../SvgPlaygroundContext";
import { CodeSurface } from "./CodeSurface";

export const InputPanel = memo(function InputPanel() {
  const { inputSvg, setSvg } = useSvgPlaygroundInputPanelContext();
  const handleSvgChange = useCallback(
    (nextSvg: string): void => {
      setSvg(nextSvg);
    },
    [setSvg],
  );

  return (
    <article className="panel panel-input">
      <div className="panel-header panel-header-inline">
        <h2>Input SVG</h2>
        <span className="status-pill">Editable</span>
      </div>
      <CodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value={inputSvg}
        onChange={handleSvgChange}
      />
    </article>
  );
});
