import { DashIcon, PackageIcon, PlusIcon } from "@primer/octicons-react";
import {
  type CSSProperties,
  type ChangeEvent,
  memo,
  useCallback,
  useMemo,
} from "react";

import type { SvgPreset } from "../model";
import type {
  ReactSourceState,
  TransformState,
} from "./controller/svg-playground-controller-types";
import type { RippleHandlers } from "./use-press-ripple";
import type { UseShareButtonResult } from "./use-share-button";

import { FloatingPresetTabBar } from "./FloatingPresetTabBar";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";
const MIN_SIZE = 64;
const MAX_SIZE = 320;

const formatNumberLabel = (value: number): string => {
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const getSizeSliderStyle = (size: number): CSSProperties => {
  const progress = ((size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * 100;

  return {
    ["--slider-progress" as const]: `${progress}%`,
  } as CSSProperties;
};

const renderPanelFallback = (message: string) => {
  return <p className="panel-empty">{message}</p>;
};

type SvgPlaygroundHeaderProps = {
  canShareUrl: boolean;
  copyShareUrl: () => void;
  packageName: string | null;
  rippleHandlers: RippleHandlers;
  shareButton: UseShareButtonResult;
  slug: string;
  slugTransitionName: string;
  title: string;
  titleTransitionName: string;
};

const PlaygroundHeader = memo(function PlaygroundHeader(
  props: SvgPlaygroundHeaderProps,
) {
  const {
    canShareUrl,
    copyShareUrl,
    packageName,
    rippleHandlers,
    shareButton,
    slug,
    slugTransitionName,
    title,
    titleTransitionName,
  } = props;
  const titleTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: titleTransitionName,
    };
  }, [titleTransitionName]);
  const slugTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: slugTransitionName,
    };
  }, [slugTransitionName]);

  return (
    <section className="intro-band">
      <div className="intro-copy">
        <h1
          className="intro-title"
          data-view-transition-name={titleTransitionName}
          style={titleTransitionStyle}
        >
          {title}
        </h1>
        <div className="intro-meta">
          <a
            className="slug-chip"
            data-view-transition-name={slugTransitionName}
            href="../"
            style={slugTransitionStyle}
          >
            /{slug}
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
  );
});

type PresetTabBarSectionProps = {
  activePresetId: string | null;
  presets: readonly SvgPreset[];
  selectPreset: (presetId: string) => void;
};

const PresetTabBarSection = memo(function PresetTabBarSection(
  props: PresetTabBarSectionProps,
) {
  const { activePresetId, presets, selectPreset } = props;

  return (
    <FloatingPresetTabBar
      activePresetId={activePresetId}
      presets={presets}
      selectPreset={selectPreset}
    />
  );
});

type StrokeWidthControlProps = {
  rippleHandlers: RippleHandlers;
  setStrokeWidth: (strokeWidth: number) => void;
  stepStrokeWidth: (delta: number) => void;
  strokeWidth: number;
};

const StrokeWidthControl = memo(function StrokeWidthControl(
  props: StrokeWidthControlProps,
) {
  const { rippleHandlers, setStrokeWidth, stepStrokeWidth, strokeWidth } =
    props;
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
          strokeWidth
        </label>
        <output className="control-value">
          {formatNumberLabel(strokeWidth)}
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
          value={strokeWidth}
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
  );
});

type SizeControlProps = {
  setSize: (size: number) => void;
  size: number;
};

const SizeControl = memo(function SizeControl(props: SizeControlProps) {
  const { setSize, size } = props;
  const handleSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setSize(Number(event.currentTarget.value));
    },
    [setSize],
  );

  return (
    <section className="control-pod">
      <div className="control-pod-head">
        <label className="control-title" htmlFor="size-input">
          size
        </label>
        <output className="control-value">{Math.round(size)}px</output>
      </div>
      <input
        aria-label="size"
        className="size-slider"
        id="size-input"
        max={MAX_SIZE}
        min={MIN_SIZE}
        style={getSizeSliderStyle(size)}
        step="4"
        type="range"
        value={size}
        onChange={handleSizeChange}
      />
    </section>
  );
});

type ColorControlProps = {
  color: string;
  setColor: (color: string) => void;
};

const ColorControl = memo(function ColorControl(props: ColorControlProps) {
  const { color, setColor } = props;
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

type PanelGroupProps = {
  inputSvg: string;
  optimizedSvg: string;
  previewHtml: { __html: string } | null;
  reactSourceState: ReactSourceState;
  setSvg: (svg: string) => void;
  status: TransformState["kind"];
  statusMessage: string;
};

const PanelGroup = memo(function PanelGroup(props: PanelGroupProps) {
  const {
    inputSvg,
    optimizedSvg,
    previewHtml,
    reactSourceState,
    setSvg,
    status,
    statusMessage,
  } = props;
  const handleSvgChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      setSvg(event.currentTarget.value);
    },
    [setSvg],
  );

  return (
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
  );
});

export type SvgPlaygroundViewProps = {
  activePresetId: string | null;
  canShareUrl: boolean;
  color: string;
  copyShareUrl: () => void;
  inputSvg: string;
  packageName: string | null;
  previewHtml: { __html: string } | null;
  reactSourceState: ReactSourceState;
  rippleHandlers: RippleHandlers;
  selectPreset: (presetId: string) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
  setSvg: (svg: string) => void;
  shareButton: UseShareButtonResult;
  size: number;
  slug: string;
  slugTransitionName: string;
  stepStrokeWidth: (delta: number) => void;
  strokeWidth: number;
  title: string;
  titleTransitionName: string;
  transformState: TransformState;
  visiblePresets: readonly SvgPreset[];
};

export const SvgPlaygroundView = (props: SvgPlaygroundViewProps) => {
  const {
    activePresetId,
    canShareUrl,
    color,
    copyShareUrl,
    inputSvg,
    packageName,
    previewHtml,
    reactSourceState,
    rippleHandlers,
    selectPreset,
    setColor,
    setSize,
    setStrokeWidth,
    setSvg,
    shareButton,
    size,
    slug,
    slugTransitionName,
    stepStrokeWidth,
    strokeWidth,
    title,
    titleTransitionName,
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

  return (
    <main className="app-shell playground-shell">
      <PlaygroundHeader
        canShareUrl={canShareUrl}
        copyShareUrl={copyShareUrl}
        packageName={packageName}
        rippleHandlers={rippleHandlers}
        shareButton={shareButton}
        slug={slug}
        slugTransitionName={slugTransitionName}
        title={title}
        titleTransitionName={titleTransitionName}
      />

      <PresetTabBarSection
        activePresetId={activePresetId}
        presets={visiblePresets}
        selectPreset={selectPreset}
      />

      <section className="command-dock" aria-label="Playground controls">
        <div className="dock-row dock-row-controls">
          <StrokeWidthControl
            rippleHandlers={rippleHandlers}
            setStrokeWidth={setStrokeWidth}
            stepStrokeWidth={stepStrokeWidth}
            strokeWidth={strokeWidth}
          />
          <SizeControl setSize={setSize} size={size} />
          <ColorControl color={color} setColor={setColor} />
        </div>
      </section>

      <PanelGroup
        inputSvg={inputSvg}
        optimizedSvg={optimizedSvg}
        previewHtml={previewHtml}
        reactSourceState={reactSourceState}
        setSvg={setSvg}
        status={status}
        statusMessage={statusMessage}
      />
    </main>
  );
};
