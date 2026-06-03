import { memo } from "react";

import { useSvgPlaygroundPanelsContext } from "../SvgPlaygroundContext";
import { CodeSurface } from "./CodeSurface";
import { renderPanelFallback } from "./renderPanelFallback";

export const OptimizedPanel = memo(function OptimizedPanel() {
  const { optimizedSvg, status, statusMessage } =
    useSvgPlaygroundPanelsContext();

  return (
    <article className="panel panel-optimized">
      <div className="panel-header">
        <h2>Optimized SVG</h2>
      </div>
      {(status === "success" || status === "unsafe") &&
      optimizedSvg.length > 0 ? (
        <CodeSurface
          ariaLabel="Optimized SVG"
          language="svg"
          readOnly={true}
          value={optimizedSvg}
        />
      ) : status === "loading" ? (
        renderPanelFallback("Rebuilding optimized SVG…")
      ) : status === "unsafe" ? (
        renderPanelFallback(statusMessage)
      ) : status === "error" ? (
        renderPanelFallback(statusMessage)
      ) : (
        renderPanelFallback("Paste or pick an SVG preset to begin.")
      )}
    </article>
  );
});
