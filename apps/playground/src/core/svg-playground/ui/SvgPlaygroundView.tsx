import type { CSSProperties, ChangeEvent, MouseEvent } from "react";

import { useCallback } from "react";

import type { SvgPlaygroundDefinition } from "../model";
import type { SvgPlaygroundViewModel } from "./use-svg-playground-controller";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";
const INPUT_PANEL_STYLE = {
  animationDelay: "0ms",
} satisfies CSSProperties;
const OPTIMIZED_PANEL_STYLE = {
  animationDelay: "70ms",
} satisfies CSSProperties;
const REACT_SOURCE_PANEL_STYLE = {
  animationDelay: "140ms",
} satisfies CSSProperties;
const PREVIEW_PANEL_STYLE = {
  animationDelay: "210ms",
} satisfies CSSProperties;

const formatNumberLabel = (value: number): string => {
  return value.toFixed(1).replace(/\.0$/, "");
};

const renderPanelFallback = (message: string) => {
  return <p className="panel-empty">{message}</p>;
};

export interface SvgPlaygroundViewProps extends SvgPlaygroundViewModel {
  definition: SvgPlaygroundDefinition;
}

export const SvgPlaygroundView = (props: SvgPlaygroundViewProps) => {
  const {
    definition,
    activePresetId,
    copyShareUrl,
    copyStatus,
    previewHtml,
    queryState,
    reactSourceState,
    selectPreset,
    setColor,
    setSize,
    setStrokeWidth,
    setSvg,
    stepStrokeWidth,
    transformState,
  } = props;

  const optimizedSvg =
    transformState.kind === "success" ? transformState.optimizedSvg : "";
  const status = transformState.kind;
  const statusMessage =
    transformState.kind === "error" || transformState.kind === "unsafe"
      ? transformState.message
      : "";

  const handlePresetButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const presetId = event.currentTarget.dataset.presetId;

      if (presetId !== undefined) {
        selectPreset(presetId);
      }
    },
    [selectPreset],
  );

  const handleDecreaseStrokeWidthClick = useCallback((): void => {
    stepStrokeWidth(-0.5);
  }, [stepStrokeWidth]);

  const handleIncreaseStrokeWidthClick = useCallback((): void => {
    stepStrokeWidth(0.5);
  }, [stepStrokeWidth]);

  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setStrokeWidth(Number(event.currentTarget.value));
    },
    [setStrokeWidth],
  );

  const handleSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setSize(Number(event.currentTarget.value));
    },
    [setSize],
  );

  const handleColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setColor(event.currentTarget.value);
    },
    [setColor],
  );

  const handleSvgChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      setSvg(event.currentTarget.value);
    },
    [setSvg],
  );

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{definition.eyebrow}</p>
          <h1>{definition.title}</h1>
          <p className="hero-body">{definition.description}</p>
        </div>
        <div className="hero-actions">
          <button className="share-button" type="button" onClick={copyShareUrl}>
            Copy share URL
          </button>
          <span className="share-status" aria-live="polite">
            {copyStatus}
          </span>
        </div>
      </section>

      <section className="controls-bar" aria-label="Preview controls">
        <div className="preset-cluster">
          <span className="controls-label">Presets</span>
          <div className="preset-list">
            {definition.presets.map((preset) => {
              return (
                <button
                  key={preset.id}
                  aria-pressed={activePresetId === preset.id}
                  className="preset-button"
                  data-preset-id={preset.id}
                  type="button"
                  onClick={handlePresetButtonClick}
                >
                  <span>{preset.label}</span>
                  <small>{preset.description}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sliders">
          <div className="slider-field">
            <label htmlFor="stroke-width-input">strokeWidth</label>
            <div className="number-stepper">
              <button
                aria-label="Decrease strokeWidth"
                type="button"
                onClick={handleDecreaseStrokeWidthClick}
              >
                -
              </button>
              <input
                aria-label="strokeWidth"
                id="stroke-width-input"
                max="8"
                min="0.5"
                step="0.5"
                type="number"
                value={queryState.strokeWidth}
                onChange={handleStrokeWidthChange}
              />
              <button
                aria-label="Increase strokeWidth"
                type="button"
                onClick={handleIncreaseStrokeWidthClick}
              >
                +
              </button>
            </div>
            <output>{formatNumberLabel(queryState.strokeWidth)}</output>
          </div>

          <label className="slider-field">
            <span>size</span>
            <input
              aria-label="size"
              max="320"
              min="64"
              step="4"
              type="range"
              value={queryState.size}
              onChange={handleSizeChange}
            />
            <output>{Math.round(queryState.size)}px</output>
          </label>

          <label className="color-field">
            <span>color</span>
            <input
              aria-label="color"
              type="color"
              value={queryState.color}
              onChange={handleColorChange}
            />
            <code>{queryState.color}</code>
          </label>
        </div>
      </section>

      <section className="panel-grid" aria-label="Playground panels">
        <article className="panel" style={INPUT_PANEL_STYLE}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Input</p>
              <h2>Input SVG</h2>
            </div>
          </div>
          <textarea
            aria-label="Input SVG"
            className="svg-textarea"
            spellCheck={false}
            value={queryState.svg}
            onChange={handleSvgChange}
          />
        </article>

        <article className="panel" style={OPTIMIZED_PANEL_STYLE}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Output</p>
              <h2>Optimized SVG</h2>
            </div>
            <span className={`status-pill is-${status}`}>{status}</span>
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

        <article className="panel" style={REACT_SOURCE_PANEL_STYLE}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Output</p>
              <h2>Generated React source</h2>
            </div>
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

        <article className="panel" style={PREVIEW_PANEL_STYLE}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Preview</p>
              <h2>Live preview</h2>
            </div>
          </div>
          <div className="preview-stage">
            {status === "success" && previewHtml !== null ? (
              <div dangerouslySetInnerHTML={previewHtml} />
            ) : status === "success" ? (
              <div className="preview-warning" role="alert">
                <strong>Preview render failed.</strong>
                <span>
                  Expected optimized SVG to contain a root svg element.
                </span>
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
              <div className="preview-placeholder">
                Rebuilding live preview…
              </div>
            ) : (
              <div className="preview-placeholder">
                Choose a preset or paste SVG markup.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
};
