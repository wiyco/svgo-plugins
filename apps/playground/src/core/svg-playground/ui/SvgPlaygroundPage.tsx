import type { ChangeEvent, MouseEvent } from "react";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  SvgPreset,
  TransformFn,
} from "../model";

import { createPreviewMarkup } from "../preview/create-preview-markup";
import { createReactSource } from "../source/create-react-source";
import { getErrorMessage } from "../utils/get-error-message";
import { useWorkerTransform } from "../worker/use-svg-transform-worker";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";
const INPUT_PANEL_STYLE = { animationDelay: "0ms" };
const OPTIMIZED_PANEL_STYLE = { animationDelay: "70ms" };
const REACT_SOURCE_PANEL_STYLE = { animationDelay: "140ms" };
const PREVIEW_PANEL_STYLE = { animationDelay: "210ms" };

type SvgPlaygroundPageProps = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

type SvgPlaygroundAppProps = {
  definition: SvgPlaygroundDefinition;
  workerUrl: URL;
};

const getPresetIdForSvg = (
  definition: SvgPlaygroundDefinition,
  svg: string,
): string | null => {
  return (
    definition.presets.find((preset) => {
      return preset.svg === svg;
    })?.id ?? null
  );
};

const loadInitialState = (
  definition: SvgPlaygroundDefinition,
): PlaygroundQueryState => {
  return definition.parseState(window.location.search);
};

const formatNumberLabel = (value: number): string => {
  return value.toFixed(1).replace(/\.0$/, "");
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const renderPanelFallback = (message: string) => {
  return <p className="panel-empty">{message}</p>;
};

export const SvgPlaygroundPage = ({
  definition,
  transform,
}: SvgPlaygroundPageProps) => {
  const [queryState, setQueryState] = useState<PlaygroundQueryState>(() => {
    return loadInitialState(definition);
  });
  const [copyStatus, setCopyStatus] = useState("");
  const [optimizedSvg, setOptimizedSvg] = useState("");
  const [status, setStatus] = useState<
    "error" | "idle" | "loading" | "success" | "unsafe"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const deferredSvg = useDeferredValue(queryState.svg);
  const latestRequestIdRef = useRef(0);
  const activePresetId = getPresetIdForSvg(definition, queryState.svg);

  const applyTransform = useEffectEvent(
    async (svg: string, requestId: number) => {
      try {
        const result = await transform({ svg });

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (result.kind === "success") {
          setOptimizedSvg(result.optimizedSvg);
          setStatus("success");
          setStatusMessage("");
          return;
        }

        setOptimizedSvg("");
        setStatus(result.kind);
        setStatusMessage(
          result.kind === "unsafe" ? result.reason : result.message,
        );
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setOptimizedSvg("");
        setStatus("error");
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Unexpected preview failure.",
        );
      }
    },
  );

  useEffect(() => {
    const search = definition.serializeState(queryState);
    const nextUrl = search ? `?${search}` : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [definition, queryState]);

  useEffect(() => {
    const svg = deferredSvg.trim();

    if (svg.length === 0) {
      setOptimizedSvg("");
      setStatus("idle");
      setStatusMessage("");
      return;
    }

    const requestId = latestRequestIdRef.current + 1;

    latestRequestIdRef.current = requestId;
    setStatus("loading");
    void applyTransform(svg, requestId);
  }, [deferredSvg, transform]);

  const updateQueryState = useCallback(
    (nextState: Partial<PlaygroundQueryState>): void => {
      setQueryState((currentState) => {
        return {
          ...currentState,
          ...nextState,
        };
      });
    },
    [],
  );

  const adjustStrokeWidth = useCallback((delta: number): void => {
    setQueryState((currentState) => {
      return {
        ...currentState,
        strokeWidth: clamp(currentState.strokeWidth + delta, 0.5, 8),
      };
    });
  }, []);

  const handlePresetSelect = useCallback(
    (preset: SvgPreset): void => {
      startTransition(() => {
        updateQueryState({
          svg: preset.svg,
        });
      });
    },
    [updateQueryState],
  );

  const copyShareUrl = useCallback(async (): Promise<void> => {
    if (navigator.clipboard?.writeText === undefined) {
      setCopyStatus("Clipboard unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("Share URL copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }, []);

  const previewMarkup = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return null;
    }

    try {
      return createPreviewMarkup(optimizedSvg, {
        ariaLabel: "Live preview",
        color: queryState.color,
        size: queryState.size,
        strokeWidth: queryState.strokeWidth,
      });
    } catch {
      return null;
    }
  }, [optimizedSvg, queryState.color, queryState.size, queryState.strokeWidth]);
  const reactSourceState = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return {
        error: "",
        source: "",
      };
    }

    try {
      return {
        error: "",
        source: createReactSource(optimizedSvg),
      };
    } catch (error) {
      return {
        error: getErrorMessage(error, "Unable to generate React source."),
        source: "",
      };
    }
  }, [optimizedSvg]);
  const previewHtml = useMemo(() => {
    if (previewMarkup === null) {
      return null;
    }

    return {
      __html: previewMarkup,
    };
  }, [previewMarkup]);

  const handleCopyShareUrlClick = useCallback((): void => {
    void copyShareUrl();
  }, [copyShareUrl]);

  const handlePresetButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const presetId = event.currentTarget.dataset.presetId;

      if (presetId === undefined) {
        return;
      }

      const preset = definition.presets.find((candidate) => {
        return candidate.id === presetId;
      });

      if (preset !== undefined) {
        handlePresetSelect(preset);
      }
    },
    [definition.presets, handlePresetSelect],
  );

  const handleDecreaseStrokeWidthClick = useCallback((): void => {
    adjustStrokeWidth(-0.5);
  }, [adjustStrokeWidth]);

  const handleIncreaseStrokeWidthClick = useCallback((): void => {
    adjustStrokeWidth(0.5);
  }, [adjustStrokeWidth]);

  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      updateQueryState({
        strokeWidth: clamp(Number(event.currentTarget.value), 0.5, 8),
      });
    },
    [updateQueryState],
  );

  const handleSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      updateQueryState({
        size: Number(event.currentTarget.value),
      });
    },
    [updateQueryState],
  );

  const handleColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      updateQueryState({
        color: event.currentTarget.value,
      });
    },
    [updateQueryState],
  );

  const handleSvgChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      updateQueryState({
        svg: event.currentTarget.value,
      });
    },
    [updateQueryState],
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
          <button
            className="share-button"
            type="button"
            onClick={handleCopyShareUrlClick}
          >
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

export const SvgPlaygroundApp = ({
  definition,
  workerUrl,
}: SvgPlaygroundAppProps) => {
  const transform = useWorkerTransform(workerUrl);

  if (transform === null) {
    return (
      <main className="app-shell">
        <section className="panel">
          <div className="preview-placeholder">
            Booting the transform worker…
          </div>
        </section>
      </main>
    );
  }

  return <SvgPlaygroundPage definition={definition} transform={transform} />;
};
