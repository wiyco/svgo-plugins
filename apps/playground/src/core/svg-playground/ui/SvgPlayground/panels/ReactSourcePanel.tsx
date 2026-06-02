import { memo } from "react";

import { useSvgPlaygroundPanelsContext } from "../SvgPlaygroundContext";
import { renderPanelFallback } from "./renderPanelFallback";

export const ReactSourcePanel = memo(function ReactSourcePanel() {
  const { reactSourceState, status, statusMessage } =
    useSvgPlaygroundPanelsContext();

  return (
    <article className="panel panel-react">
      <div className="panel-header">
        <h2>React source</h2>
      </div>
      {status === "success" && reactSourceState.source.length > 0 ? (
        <pre className="code-panel">{reactSourceState.source}</pre>
      ) : status === "success" && reactSourceState.error.length > 0 ? (
        renderPanelFallback(reactSourceState.error)
      ) : status === "loading" ? (
        renderPanelFallback("Rebuilding React component source…")
      ) : status === "unsafe" ? (
        renderPanelFallback(statusMessage)
      ) : status === "error" ? (
        renderPanelFallback(statusMessage)
      ) : (
        renderPanelFallback(
          "React source appears here after a successful transform.",
        )
      )}
    </article>
  );
});
