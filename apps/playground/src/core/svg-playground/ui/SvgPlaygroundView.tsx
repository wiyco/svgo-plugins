import { DashIcon, PackageIcon, PlusIcon } from "@primer/octicons-react";
import {
  type CSSProperties,
  type ChangeEvent,
  useCallback,
  useMemo,
} from "react";

import type { SvgPlaygroundDefinition } from "../model";
import type { SvgPlaygroundViewModel } from "./use-svg-playground-controller";

import { getPlaygroundPackageName } from "../../../playgrounds/registry";
import { getPlaygroundViewTransitionNames } from "../../../view-transition-names";
import { FloatingPresetTabBar } from "./FloatingPresetTabBar";
import { usePressRipple } from "./use-press-ripple";
import { useShareButton } from "./use-share-button";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";

const formatNumberLabel = (value: number): string => {
  return value.toFixed(2).replace(/\.?0+$/, "");
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
    canShareUrl,
    copyShareUrl,
    previewHtml,
    queryState,
    reactSourceState,
    selectPreset,
    setColor,
    setSize,
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
    setStrokeWidth,
    setSvg,
    stepStrokeWidth,
    transformState,
    visiblePresets,
  } = props;

  const optimizedSvg =
    transformState.kind === "success" ? transformState.optimizedSvg : "";
  const status = transformState.kind;
  const statusMessage =
    transformState.kind === "error" || transformState.kind === "unsafe"
      ? transformState.message
      : "";
  const rippleHandlers = usePressRipple();
  const shareButton = useShareButton({
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
  });
  const packageName = getPlaygroundPackageName(definition.slug);
  const transitionNames = getPlaygroundViewTransitionNames(definition.slug);
  const titleTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: transitionNames.title,
    };
  }, [transitionNames.title]);
  const slugTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: transitionNames.slug,
    };
  }, [transitionNames.slug]);
  const sizeSliderStyle = useMemo<CSSProperties>(() => {
    const minSize = 64;
    const maxSize = 320;
    const progress = ((queryState.size - minSize) / (maxSize - minSize)) * 100;

    return {
      ["--slider-progress" as const]: `${progress}%`,
    } as CSSProperties;
  }, [queryState.size]);

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
    <main className="app-shell playground-shell">
      <section className="intro-band">
        <div className="intro-copy">
          <h1
            className="intro-title"
            data-view-transition-name={transitionNames.title}
            style={titleTransitionStyle}
          >
            {definition.title}
          </h1>
          <div className="intro-meta">
            <a
              className="slug-chip"
              data-view-transition-name={transitionNames.slug}
              href="../"
              style={slugTransitionStyle}
            >
              /{definition.slug}
            </a>
            {packageName !== null ? (
              <code className="package-chip">
                <span aria-hidden="true" className="package-chip-icon">
                  <PackageIcon size={12} />
                </span>
                <span>{packageName}</span>
              </code>
            ) : null}
          </div>
        </div>

        <div className="intro-actions">
          <button
            className="share-button ripple-surface"
            data-share-feedback-state={shareButton.shareButtonState}
            disabled={!canShareUrl}
            ref={shareButton.shareButtonRef}
            style={shareButton.shareButtonStyle}
            type="button"
            onClick={copyShareUrl}
            {...rippleHandlers}
          >
            <span aria-hidden="true" className="share-button-icon-wrap">
              {shareButton.shareButtonIcon}
            </span>
            <span
              ref={shareButton.shareButtonLabelRef}
              className="button-label share-button-text"
            >
              {shareButton.shareButtonLabel}
            </span>
            <span
              aria-hidden="true"
              ref={shareButton.shareButtonMeasureRef}
              className="share-button-measure"
            >
              {shareButton.shareButtonLabel}
            </span>
          </button>
          <span className="visually-hidden" aria-live="polite">
            {shareButton.shareAnnouncement}
          </span>
        </div>
      </section>

      <FloatingPresetTabBar
        activePresetId={activePresetId}
        presets={visiblePresets}
        selectPreset={selectPreset}
      />

      <section className="command-dock" aria-label="Playground controls">
        <div className="dock-row dock-row-controls">
          <section className="control-pod">
            <div className="control-pod-head">
              <label className="control-title" htmlFor="stroke-width-input">
                strokeWidth
              </label>
              <output className="control-value">
                {formatNumberLabel(queryState.strokeWidth)}
              </output>
            </div>
            <div className="number-stepper">
              <button
                aria-label="Decrease strokeWidth"
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
                aria-label="strokeWidth"
                id="stroke-width-input"
                max="8"
                min="0.25"
                step="0.25"
                type="number"
                value={queryState.strokeWidth}
                onChange={handleStrokeWidthChange}
              />
              <button
                aria-label="Increase strokeWidth"
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

          <section className="control-pod">
            <div className="control-pod-head">
              <label className="control-title" htmlFor="size-input">
                size
              </label>
              <output className="control-value">
                {Math.round(queryState.size)}px
              </output>
            </div>
            <input
              aria-label="size"
              className="size-slider"
              id="size-input"
              max="320"
              min="64"
              style={sizeSliderStyle}
              step="4"
              type="range"
              value={queryState.size}
              onChange={handleSizeChange}
            />
          </section>

          <section className="control-pod">
            <div className="control-pod-head">
              <label className="control-title" htmlFor="color-input">
                color
              </label>
              <code className="control-value">{queryState.color}</code>
            </div>
            <div className="color-swatch-row">
              <input
                aria-label="color"
                id="color-input"
                type="color"
                value={queryState.color}
                onChange={handleColorChange}
              />
            </div>
          </section>
        </div>
      </section>

      <section className="workbench-grid" aria-label="Playground panels">
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

        <article className="panel panel-input">
          <div className="panel-header panel-header-inline">
            <h2>Input SVG</h2>
            <span className="status-pill">Editable</span>
          </div>
          <textarea
            aria-label="Input SVG"
            className="svg-textarea"
            spellCheck={false}
            value={queryState.svg}
            onChange={handleSvgChange}
          />
        </article>

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
      </section>
    </main>
  );
};
