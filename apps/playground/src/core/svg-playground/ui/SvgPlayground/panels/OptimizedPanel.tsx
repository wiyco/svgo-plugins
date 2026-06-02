import { memo } from "react";

import { useSvgPlaygroundPanelsContext } from "../SvgPlaygroundContext";
import { renderPanelFallback } from "./renderPanelFallback";

export const OptimizedPanel = memo(function OptimizedPanel() {
  const { optimizedSvg, status, statusMessage } =
    useSvgPlaygroundPanelsContext();

  return (
    <article className="panel panel-optimized">
      <div className="panel-header">
        <h2>Optimized SVG</h2>
      </div>
      {status === "success" && optimizedSvg.length > 0 ? (
        <pre className="code-panel">{optimizedSvg}</pre>
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
