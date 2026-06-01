import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import type {
  PlaygroundQueryState,
  PreviewComponent,
  SvgPlaygroundDefinition,
  TransformFn,
} from "../model";
import { createPreviewComponentFromJs } from "../preview/create-preview-component";
import { useWorkerTransform } from "../worker/use-svg-transform-worker";

const PREVIEW_BLOCKED_MESSAGE = "Preview disabled for unsafe SVG input.";

type SvgPlaygroundPageProps = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

type SvgPlaygroundAppProps = {
  definition: SvgPlaygroundDefinition;
  workerUrl: URL;
};

const createEmptyPreview = (): PreviewComponent | null => {
  return null;
};

const findPresetById = (
  definition: SvgPlaygroundDefinition,
  presetId: string,
) => {
  return (
    definition.presets.find((preset) => {
      return preset.id === presetId;
    }) ?? null
  );
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
  if (typeof window === "undefined") {
    return definition.defaultState;
  }

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
  const [previewComponent, setPreviewComponent] =
    useState<PreviewComponent | null>(createEmptyPreview);
  const [reactSource, setReactSource] = useState("");
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
          const nextPreviewComponent = createPreviewComponentFromJs(
            result.previewCode,
          );

          setOptimizedSvg(result.optimizedSvg);
          setPreviewComponent(() => nextPreviewComponent);
          setReactSource(result.reactSource);
          setStatus("success");
          setStatusMessage("");
          return;
        }

        setOptimizedSvg("");
        setPreviewComponent(createEmptyPreview);
        setReactSource("");
        setStatus(result.kind);
        setStatusMessage(
          result.kind === "unsafe" ? result.reason : result.message,
        );
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setOptimizedSvg("");
        setPreviewComponent(createEmptyPreview);
        setReactSource("");
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
    if (typeof window === "undefined") {
      return;
    }

    const search = definition.serializeState(queryState);
    const nextUrl = search ? `?${search}` : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [definition, queryState]);

  useEffect(() => {
    const svg = deferredSvg.trim();

    if (svg.length === 0) {
      setOptimizedSvg("");
      setPreviewComponent(createEmptyPreview);
      setReactSource("");
      setStatus("idle");
      setStatusMessage("");
      return;
    }

    const requestId = latestRequestIdRef.current + 1;

    latestRequestIdRef.current = requestId;
    setStatus("loading");
    void applyTransform(svg, requestId);
  }, [deferredSvg, transform]);

  const updateQueryState = (nextState: Partial<PlaygroundQueryState>): void => {
    setQueryState((currentState) => {
      return {
        ...currentState,
        ...nextState,
      };
    });
  };

  const adjustStrokeWidth = (delta: number): void => {
    setQueryState((currentState) => {
      return {
        ...currentState,
        strokeWidth: clamp(currentState.strokeWidth + delta, 0.5, 8),
      };
    });
  };

  const handlePresetSelect = (presetId: string): void => {
    const preset = findPresetById(definition, presetId);

    if (preset === null) {
      return;
    }

    startTransition(() => {
      updateQueryState({
        svg: preset.svg,
      });
    });
  };

  const copyShareUrl = async (): Promise<void> => {
    if (typeof window === "undefined" || !("clipboard" in navigator)) {
      setCopyStatus("Clipboard unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("Share URL copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const Preview = previewComponent;

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
            onClick={() => void copyShareUrl()}
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
                  type="button"
                  onClick={() => {
                    handlePresetSelect(preset.id);
                  }}
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
                onClick={() => {
                  adjustStrokeWidth(-0.5);
                }}
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
                onChange={(event) => {
                  updateQueryState({
                    strokeWidth: clamp(
                      Number(event.currentTarget.value),
                      0.5,
                      8,
                    ),
                  });
                }}
              />
              <button
                aria-label="Increase strokeWidth"
                type="button"
                onClick={() => {
                  adjustStrokeWidth(0.5);
                }}
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
              onChange={(event) => {
                updateQueryState({
                  size: Number(event.currentTarget.value),
                });
              }}
            />
            <output>{Math.round(queryState.size)}px</output>
          </label>

          <label className="color-field">
            <span>color</span>
            <input
              aria-label="color"
              type="color"
              value={queryState.color}
              onChange={(event) => {
                updateQueryState({
                  color: event.currentTarget.value,
                });
              }}
            />
            <code>{queryState.color}</code>
          </label>
        </div>
      </section>

      <section className="panel-grid" aria-label="Playground panels">
        <article className="panel" style={{ animationDelay: "0ms" }}>
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
            onChange={(event) => {
              updateQueryState({
                svg: event.currentTarget.value,
              });
            }}
          />
        </article>

        <article className="panel" style={{ animationDelay: "70ms" }}>
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

        <article className="panel" style={{ animationDelay: "140ms" }}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Output</p>
              <h2>Generated React source</h2>
            </div>
          </div>
          {status === "success" && reactSource.length > 0 ? (
            <pre className="code-panel">{reactSource}</pre>
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

        <article className="panel" style={{ animationDelay: "210ms" }}>
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Preview</p>
              <h2>Live preview</h2>
            </div>
          </div>
          <div className="preview-stage">
            {status === "success" && Preview !== null ? (
              <Preview
                aria-label="Live preview"
                height={queryState.size}
                strokeWidth={queryState.strokeWidth}
                style={{ color: queryState.color }}
                width={queryState.size}
              />
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
