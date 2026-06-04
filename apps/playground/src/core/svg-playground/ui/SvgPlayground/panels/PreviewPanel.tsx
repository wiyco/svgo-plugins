import { memo } from "react";

import { useSvgPlaygroundPanelsContext } from "../SvgPlaygroundContext";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";

export const PreviewPanel = memo(function PreviewPanel() {
  const { previewHtml, status, statusMessage } =
    useSvgPlaygroundPanelsContext();

  return (
    <article className="panel panel-preview">
      <div className="panel-header panel-header-inline">
        <h2>Preview</h2>
        <span className={`status-pill is-${status}`}>{status}</span>
      </div>

      <div className="preview-stage">
        {status === "success" && previewHtml !== null ? (
          <div
            className="preview-render"
            dangerouslySetInnerHTML={previewHtml}
          />
        ) : status === "success" ? (
          <div className="preview-warning" role="alert">
            <strong>Preview render failed.</strong>
            <span>Expected optimized SVG to contain a root svg element.</span>
          </div>
        ) : status === "unsafe" ? (
          <div className="preview-warning" role="status">
            <strong>{PREVIEW_BLOCKED_MESSAGE}</strong>
            <span>{statusMessage}</span>
          </div>
        ) : status === "error" ? (
          <div className="preview-warning" role="alert">
            <strong>Transform failed.</strong>
            <span>{statusMessage}</span>
          </div>
        ) : status === "loading" ? (
          <div className="preview-placeholder">Rebuilding live preview…</div>
        ) : (
          <div className="preview-placeholder">
            Choose a preset or paste SVG markup.
          </div>
        )}
      </div>
    </article>
  );
});
