import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../../core/svg-playground/model";

import { PLAYGROUND_URL_SYNC_DELAY_MS } from "../../core/svg-playground/ui/controller/use-playground-query-state";
import { SvgPlaygroundPage } from "../../core/svg-playground/ui/SvgPlaygroundPage";
import { applyControlsToSvg } from "../../core/svg-playground/utils/svg-controls";
import { hoistStrokeWidthPlayground } from "./definition";

type RenderedApp = {
  container: HTMLDivElement;
  root: Root;
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const flushDeferredReactSourceBuild = async (): Promise<void> => {
  await act(async () => {
    vi.runAllTimers();
    await flush();
  });
};

const stampOptimizedSvg = (
  svg: string,
  presetName: "single" | "multiple" | "mixed",
) => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== "svg") {
    return svg;
  }

  rootElement.setAttribute("data-optimized", presetName);
  rootElement.setAttribute("data-source", presetName);

  return new XMLSerializer().serializeToString(rootElement);
};

const createSuccessResult = (
  presetName: "single" | "multiple" | "mixed",
  svg = "<svg />",
) => {
  return {
    kind: "success" as const,
    optimizedSvg: stampOptimizedSvg(svg, presetName),
  };
};

const getPresetName = (svg: string): "single" | "multiple" | "mixed" => {
  if (svg.includes("M12 3.5L18 5.75V11.25")) {
    return "single";
  }

  if (svg.includes('stroke-width="1.25"')) {
    return "mixed";
  }

  return "multiple";
};

const createTransformStub = (): TransformFn => {
  return async ({ svg }) => {
    if (svg.includes("<script")) {
      return {
        kind: "unsafe",
        reason: "Script elements are blocked in the playground preview.",
      };
    }

    if (svg.includes("broken-payload")) {
      return {
        kind: "error",
        message: "SVGO said no.",
      };
    }

    return createSuccessResult(getPresetName(svg), svg);
  };
};

const changeFieldValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  nextValue: string,
): void => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  descriptor?.set?.call(element, nextValue);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const getInputSvgTextarea = (
  container: HTMLElement,
): HTMLTextAreaElement | null => {
  return container.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Input SVG"]',
  );
};

const getInputSvgValue = (container: HTMLElement): string => {
  const textarea = getInputSvgTextarea(container);

  if (textarea !== null) {
    return textarea.value;
  }

  return (
    container.querySelector<HTMLElement>('[aria-label="Input SVG"]')
      ?.textContent ?? ""
  );
};

const changeInputSvgValue = (
  container: HTMLElement,
  nextValue: string,
): void => {
  const textarea = getInputSvgTextarea(container);

  if (textarea === null) {
    throw new Error("Expected the Input SVG fallback textarea to be editable.");
  }

  changeFieldValue(textarea, nextValue);
};

const getPanelCodeText = (container: HTMLElement, selector: string): string => {
  return container.querySelector<HTMLElement>(selector)?.textContent ?? "";
};

const renderPlayground = async (
  transform: TransformFn,
  definition = hoistStrokeWidthPlayground,
): Promise<RenderedApp> => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);

  await act(async () => {
    root.render(
      <SvgPlaygroundPage definition={definition} transform={transform} />,
    );
    await flush();
  });

  return {
    container,
    root,
  };
};

const getFloatingPresetBar = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector(
    '.floating-preset-tabbar[aria-label="Playground presets"]',
  );
};

const getPresetButtons = (container: HTMLElement): HTMLButtonElement[] => {
  return Array.from(
    getFloatingPresetBar(container)?.querySelectorAll<HTMLButtonElement>(
      ".preset-button",
    ) ?? [],
  );
};

const findPresetButton = (
  container: HTMLElement,
  label: string,
): HTMLButtonElement | undefined => {
  return getPresetButtons(container).find((button) => {
    return button.textContent?.includes(label) ?? false;
  });
};

let renderedApp: RenderedApp | null = null;
const originalClipboard = navigator.clipboard;

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });

  if (renderedApp !== null) {
    await act(async () => {
      renderedApp?.root.unmount();
      await flush();
    });
  }

  renderedApp = null;
});

describe("hoist stroke width playground", () => {
  it("updates all four panels when the preset changes", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const presetBar = getFloatingPresetBar(renderedApp.container);
    const singlePresetButton = findPresetButton(
      renderedApp.container,
      "Single",
    );
    const multiplePresetButton = findPresetButton(
      renderedApp.container,
      "Multiple",
    );
    const mixedPresetButton = findPresetButton(renderedApp.container, "Mixed");

    expect(presetBar).not.toBeNull();
    expect(presetBar?.textContent).toContain("Single");
    expect(presetBar?.textContent).toContain("Multiple");
    expect(presetBar?.textContent).toContain("Mixed");
    expect(singlePresetButton?.getAttribute("aria-label")).toBe(
      "Single Weight",
    );
    expect(multiplePresetButton?.getAttribute("aria-label")).toBe(
      "Multiple Weights",
    );
    expect(mixedPresetButton?.getAttribute("aria-label")).toBe("Mixed Weights");
    expect(singlePresetButton?.getAttribute("aria-pressed")).toBe("true");
    expect(multiplePresetButton?.getAttribute("aria-pressed")).toBe("false");
    expect(mixedPresetButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      multiplePresetButton?.click();
      await flush();
    });

    const optimizedPanel = renderedApp.container.textContent;
    const previewSvg = renderedApp.container.querySelector<SVGSVGElement>(
      'svg[data-optimized="multiple"]',
    );
    const slugLink =
      renderedApp.container.querySelector<HTMLAnchorElement>(".slug-chip");
    const expectedSvg = applyControlsToSvg(
      hoistStrokeWidthPlayground.presets[1]?.svg ?? "",
      hoistStrokeWidthPlayground.defaultState,
    );

    expect(getInputSvgValue(renderedApp.container)).toBe(expectedSvg);
    expect(optimizedPanel).toContain('data-optimized="multiple"');
    expect(optimizedPanel).toContain('data-source="multiple"');
    expect(optimizedPanel).toContain('stroke-width="2"');
    expect(previewSvg).not.toBeNull();
    expect(previewSvg?.getAttribute("width")).toBe(
      String(hoistStrokeWidthPlayground.defaultState.size),
    );
    expect(previewSvg?.getAttribute("height")).toBe(
      String(hoistStrokeWidthPlayground.defaultState.size),
    );
    expect(previewSvg?.getAttribute("style")).toContain("color: #155eef");
    expect(slugLink?.getAttribute("href")).toBe("../");
    expect(multiplePresetButton?.className).toContain("ripple-surface");
    expect(singlePresetButton?.getAttribute("aria-pressed")).toBe("false");
    expect(multiplePresetButton?.getAttribute("aria-pressed")).toBe("true");
  });

  it("loads legacy query state, normalizes it, and keeps the URL in sync", async () => {
    vi.useFakeTimers();
    const legacyState = {
      color: "#0f766e",
      size: 240,
      strokeWidth: 3.5,
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" /></svg>`,
    };
    const serialized = hoistStrokeWidthPlayground.serializeState(legacyState);
    const normalizedState = {
      ...legacyState,
      svg: applyControlsToSvg(legacyState.svg, legacyState),
    };

    window.history.replaceState({}, "", `/?${serialized}`);
    renderedApp = await renderPlayground(createTransformStub());

    const colorInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="Color"]',
    );

    expect(colorInput?.value).toBe("#0f766e");
    expect(renderedApp.container.textContent).toContain("240px");
    expect(renderedApp.container.textContent).toContain("3.5");
    expect(getInputSvgValue(renderedApp.container)).toBe(normalizedState.svg);
    expect(window.location.search).toBe(`?${serialized}`);

    await act(async () => {
      vi.advanceTimersByTime(PLAYGROUND_URL_SYNC_DELAY_MS);
      await flush();
    });

    expect(window.location.search).toBe(
      `?${hoistStrokeWidthPlayground.serializeState(normalizedState)}`,
    );

    await act(async () => {
      if (colorInput !== null) {
        changeFieldValue(colorInput, "#ff6600");
      }
      await flush();
    });

    expect(window.location.search).not.toContain("color=%23ff6600");

    await act(async () => {
      vi.advanceTimersByTime(PLAYGROUND_URL_SYNC_DELAY_MS);
      await flush();
    });

    expect(window.location.search).toContain("color=%23ff6600");
  });

  it("falls back to the bare pathname when the serialized query is empty", async () => {
    renderedApp = await renderPlayground(createTransformStub(), {
      ...hoistStrokeWidthPlayground,
      serializeState: () => "",
    });

    expect(window.location.pathname).toBe("/");
    expect(window.location.search).toBe("");
  });

  it("syncs command-dock controls back from direct svg edits", async () => {
    renderedApp = await renderPlayground(createTransformStub());
    const app = renderedApp;

    const colorInput = app.container.querySelector<HTMLInputElement>(
      'input[aria-label="Color"]',
    );
    const sizeInput = app.container.querySelector<HTMLInputElement>(
      'input[aria-label="Size"]',
    );
    const strokeWidthInput = app.container.querySelector<HTMLInputElement>(
      'input[aria-label="Stroke width"]',
    );

    await act(async () => {
      changeInputSvgValue(
        app.container,
        `<svg width="128" height="144" style="fill: none; color: #0f766e" viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" stroke-width="3.5" /><path d="M24 0L0 24" stroke="currentColor" stroke-width="3.5" /></svg>`,
      );
      await flush();
    });

    expect(colorInput?.value).toBe("#0f766e");
    expect(sizeInput?.value).toBe("128");
    expect(strokeWidthInput?.value).toBe("3.5");
    expect(app.container.textContent).toContain("128px");
    expect(app.container.textContent).toContain("3.5");
  });

  it("shows loading placeholders first and falls back to idle placeholders for empty input", async () => {
    let resolveTransform: () => void = () => undefined;
    const transform: TransformFn = async () => {
      await new Promise<void>((resolve) => {
        resolveTransform = resolve;
      });

      return {
        kind: "success",
        optimizedSvg: "<svg />",
      };
    };

    renderedApp = await renderPlayground(transform);
    const app = renderedApp;

    expect(app.container.textContent).toContain("Rebuilding optimized SVG");
    expect(app.container.textContent).toContain(
      "Rebuilding React component source",
    );
    expect(app.container.textContent).toContain("Rebuilding live preview");

    await act(async () => {
      changeInputSvgValue(app.container, "   ");
      await flush();
    });

    expect(app.container.textContent).toContain(
      "Paste or pick an SVG preset to begin.",
    );
    expect(app.container.textContent).toContain(
      "React source appears here after a successful transform.",
    );
    expect(app.container.textContent).toContain(
      "Choose a preset or paste SVG markup.",
    );

    resolveTransform();
  });

  it("shows only safe presets in the floating preset tab bar", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const presetBar = getFloatingPresetBar(renderedApp.container);
    const presetButtons = getPresetButtons(renderedApp.container);
    const commandDock =
      renderedApp.container.querySelector<HTMLElement>(".command-dock");

    expect(presetBar).not.toBeNull();
    expect(presetButtons).toHaveLength(3);
    expect(presetBar?.textContent).toContain("Single");
    expect(presetBar?.textContent).toContain("Multiple");
    expect(presetBar?.textContent).toContain("Mixed");
    expect(presetBar?.textContent).not.toContain("Unsafe Script");
    expect(commandDock?.textContent).not.toContain("Single");
    expect(commandDock?.textContent).not.toContain("Multiple");
    expect(commandDock?.textContent).not.toContain("Mixed");
  });

  it("shows a preview warning for unsafe svg input", async () => {
    renderedApp = await renderPlayground(createTransformStub());
    const app = renderedApp;

    await act(async () => {
      changeInputSvgValue(
        app.container,
        `<svg viewBox="0 0 24 24"><script>alert("blocked")</script></svg>`,
      );
      await flush();
    });

    expect(app.container.textContent).toContain(
      "Preview disabled for unsafe SVG input.",
    );
  });

  it("ignores stale successful responses once a newer request has completed", async () => {
    const pendingRequests = new Map<
      string,
      {
        reject: (reason?: unknown) => void;
        resolve: (value: ReturnType<typeof createSuccessResult>) => void;
      }
    >();
    const nextSvg = `<svg viewBox="0 0 24 24"><path d="M1 1L23 23" stroke="currentColor" stroke-width="2.5" /></svg>`;
    const transform: TransformFn = ({ svg }) => {
      return new Promise((resolve, reject) => {
        pendingRequests.set(svg, {
          reject,
          resolve,
        });
      });
    };

    renderedApp = await renderPlayground(transform);
    const app = renderedApp;

    const initialSvg = getInputSvgValue(app.container);

    await act(async () => {
      changeInputSvgValue(app.container, nextSvg);
      await flush();
    });

    await act(async () => {
      pendingRequests.get(nextSvg)?.resolve(createSuccessResult("mixed"));
      await flush();
    });

    await act(async () => {
      pendingRequests.get(initialSvg)?.resolve(createSuccessResult("single"));
      await flush();
    });

    expect(app.container.textContent).toContain('data-optimized="mixed"');
    expect(
      app.container.querySelector<SVGSVGElement>('svg[data-optimized="mixed"]'),
    ).not.toBeNull();
  });

  it("ignores stale thrown errors once a newer request has completed", async () => {
    const pendingRequests = new Map<
      string,
      {
        reject: (reason?: unknown) => void;
        resolve: (value: ReturnType<typeof createSuccessResult>) => void;
      }
    >();
    const nextSvg = `<svg viewBox="0 0 24 24"><path d="M1 1L23 23" stroke="currentColor" stroke-width="2.5" /></svg>`;
    const transform: TransformFn = ({ svg }) => {
      return new Promise((resolve, reject) => {
        pendingRequests.set(svg, {
          reject,
          resolve,
        });
      });
    };

    renderedApp = await renderPlayground(transform);
    const app = renderedApp;

    const initialSvg = getInputSvgValue(app.container);

    await act(async () => {
      changeInputSvgValue(app.container, nextSvg);
      await flush();
    });

    await act(async () => {
      pendingRequests.get(nextSvg)?.resolve(createSuccessResult("mixed"));
      await flush();
    });

    await act(async () => {
      pendingRequests.get(initialSvg)?.reject(new Error("late failure"));
      await flush();
    });

    expect(app.container.textContent).toContain('data-optimized="mixed"');
    expect(app.container.textContent).not.toContain("late failure");
  });

  it("shows transform error panels when the worker returns an error result", async () => {
    renderedApp = await renderPlayground(createTransformStub());
    const app = renderedApp;

    await act(async () => {
      changeInputSvgValue(
        app.container,
        `<svg viewBox="0 0 24 24"><path d="broken-payload" /></svg>`,
      );
      await flush();
    });

    expect(app.container.textContent).toContain("SVGO said no.");
    expect(
      app.container.querySelector('[role="alert"]')?.textContent,
    ).toContain("Transform failed.");
  });

  it("shows source and preview fallbacks when optimized svg has no root svg element", async () => {
    vi.useFakeTimers();
    const transform: TransformFn = async () => {
      return {
        kind: "success",
        optimizedSvg: "<g />",
      };
    };

    renderedApp = await renderPlayground(transform);
    await flushDeferredReactSourceBuild();

    expect(renderedApp.container.textContent).toContain(
      "Expected optimized SVG to contain a root <svg> element.",
    );
    expect(
      renderedApp.container.querySelector('[role="alert"]')?.textContent,
    ).toContain("Preview render failed.");
  });

  it("shows empty-state source and preview fallbacks when the optimized svg is empty", async () => {
    const transform: TransformFn = async () => {
      return {
        kind: "success",
        optimizedSvg: "",
      };
    };

    renderedApp = await renderPlayground(transform);

    expect(renderedApp.container.textContent).toContain(
      "React source appears here after a successful transform.",
    );
    expect(
      renderedApp.container.querySelector('[role="alert"]')?.textContent,
    ).toContain("Preview render failed.");
  });

  it("shows thrown Error messages from transform failures", async () => {
    const transform: TransformFn = async () => {
      throw new Error("Broken preview runtime");
    };

    renderedApp = await renderPlayground(transform);

    expect(renderedApp.container.textContent).toContain(
      "Broken preview runtime",
    );
    expect(
      renderedApp.container.querySelector('[role="alert"]')?.textContent,
    ).toContain("Broken preview runtime");
  });

  it("uses a fallback message for non-Error transform failures", async () => {
    const transform: TransformFn = async () => {
      throw "not-an-error";
    };

    renderedApp = await renderPlayground(transform);

    expect(renderedApp.container.textContent).toContain(
      "Unexpected preview failure.",
    );
  });

  it("copies the current share URL when the clipboard is available", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn<(value: string) => Promise<void>>(
      async () => undefined,
    );

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    renderedApp = await renderPlayground(createTransformStub());

    const colorInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="Color"]',
    );
    const shareButton =
      renderedApp.container.querySelector<HTMLButtonElement>(".share-button");

    await act(async () => {
      if (colorInput !== null) {
        changeFieldValue(colorInput, "#0f766e");
      }
      await flush();
    });

    expect(window.location.search).toBe("");

    await act(async () => {
      shareButton?.click();
      await flush();
    });

    expect(window.location.search).toContain("color=%230f766e");
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(
      renderedApp.container.querySelector<HTMLElement>(".share-button-text")
        ?.textContent,
    ).toBe("Copied");
    expect(shareButton?.getAttribute("data-share-feedback-state")).toBe(
      "success",
    );
    expect(
      renderedApp.container.querySelector<HTMLElement>('[aria-live="polite"]')
        ?.textContent,
    ).toBe("Share URL copied");
  });

  it("shows clipboard unavailable when the browser API is missing", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {},
    });

    renderedApp = await renderPlayground(createTransformStub());

    const shareButton =
      renderedApp.container.querySelector<HTMLButtonElement>(".share-button");

    await act(async () => {
      shareButton?.click();
      await flush();
    });

    expect(
      renderedApp.container.querySelector<HTMLElement>(".share-button-text")
        ?.textContent,
    ).toBe("Clipboard unavailable");
    expect(shareButton?.getAttribute("data-share-feedback-state")).toBe(
      "unavailable",
    );
    expect(
      renderedApp.container.querySelector<HTMLElement>('[aria-live="polite"]')
        ?.textContent,
    ).toBe("Clipboard unavailable");
  });

  it("shows copy failures when the clipboard write rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn<(value: string) => Promise<void>>(async () => {
          throw new Error("denied");
        }),
      },
    });

    renderedApp = await renderPlayground(createTransformStub());

    const shareButton =
      renderedApp.container.querySelector<HTMLButtonElement>(".share-button");

    await act(async () => {
      shareButton?.click();
      await flush();
    });

    expect(
      renderedApp.container.querySelector<HTMLElement>(".share-button-text")
        ?.textContent,
    ).toBe("Copy failed");
    expect(shareButton?.getAttribute("data-share-feedback-state")).toBe(
      "failed",
    );
    expect(
      renderedApp.container.querySelector<HTMLElement>('[aria-live="polite"]')
        ?.textContent,
    ).toBe("Copy failed");
  });

  it("disables sharing when the current svg is unsafe", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn<(value: string) => Promise<void>>(
      async () => undefined,
    );

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    renderedApp = await renderPlayground(createTransformStub());
    const app = renderedApp;

    const shareButton =
      app.container.querySelector<HTMLButtonElement>(".share-button");

    await act(async () => {
      changeInputSvgValue(
        app.container,
        `<svg viewBox="0 0 24 24"><script>alert("blocked")</script></svg>`,
      );
      await flush();
    });

    await act(async () => {
      vi.advanceTimersByTime(PLAYGROUND_URL_SYNC_DELAY_MS);
      await flush();
    });

    await act(async () => {
      shareButton?.click();
      await flush();
    });

    expect(window.location.search).toBe("");
    expect(shareButton?.disabled).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
    expect(
      app.container.querySelector<HTMLElement>(".share-button-text")
        ?.textContent,
    ).toBe("Sharing unavailable");
    expect(shareButton?.getAttribute("data-share-feedback-state")).toBe(
      "unsafe",
    );
    expect(
      app.container.querySelector<HTMLElement>('[aria-live="polite"]')
        ?.textContent,
    ).toBe("Sharing unavailable");
  });

  it("updates the input, optimized, react, and preview panels when dock controls change", async () => {
    vi.useFakeTimers();
    renderedApp = await renderPlayground(createTransformStub());

    const increaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Increase stroke width"]',
      );
    const sizeInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="Size"]',
    );
    const colorInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="Color"]',
    );

    await act(async () => {
      increaseButton?.click();
      increaseButton?.click();
      if (sizeInput !== null) {
        changeFieldValue(sizeInput, "256");
      }
      if (colorInput !== null) {
        changeFieldValue(colorInput, "#ff6600");
      }
      await flush();
    });
    await flushDeferredReactSourceBuild();

    const inputSvg = getInputSvgValue(renderedApp.container);
    const optimizedPanelText = getPanelCodeText(
      renderedApp.container,
      ".panel-optimized .code-panel",
    );
    const reactPanelText = getPanelCodeText(
      renderedApp.container,
      ".panel-react .code-panel",
    );
    const previewSvg = renderedApp.container.querySelector<SVGSVGElement>(
      'svg[data-optimized="single"]',
    );

    expect(inputSvg).toContain('stroke-width="2.5"');
    expect(inputSvg).toContain('height="256"');
    expect(inputSvg).toContain('width="256"');
    expect(inputSvg).toContain("color: #ff6600");
    expect(optimizedPanelText).toContain('stroke-width="2.5"');
    expect(optimizedPanelText).toContain('height="256"');
    expect(optimizedPanelText).toContain('width="256"');
    expect(optimizedPanelText).toContain("color: #ff6600");
    expect(reactPanelText).toContain('strokeWidth="2.5"');
    expect(reactPanelText).toContain('height="256"');
    expect(reactPanelText).toContain('width="256"');
    expect(reactPanelText).toContain('color: "#ff6600"');
    expect(
      previewSvg?.querySelector("[stroke-width]")?.getAttribute("stroke-width"),
    ).toBe("2.5");
    expect(previewSvg?.getAttribute("height")).toBe("256");
    expect(previewSvg?.getAttribute("width")).toBe("256");
    expect(previewSvg?.getAttribute("style")).toContain("color: #ff6600");
  });

  it("formats the strokeWidth label by stripping trailing zeros across .25 steps", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const readStrokeWidthLabel = (): string | null | undefined => {
      return renderedApp?.container
        .querySelector<HTMLInputElement>("#stroke-width-input")
        ?.closest(".control-pod")
        ?.querySelector(".control-value")?.textContent;
    };
    const increaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Increase stroke width"]',
      );

    expect(readStrokeWidthLabel()).toBe("2");

    await act(async () => {
      increaseButton?.click();
      await flush();
    });

    expect(readStrokeWidthLabel()).toBe("2.25");

    await act(async () => {
      increaseButton?.click();
      await flush();
    });

    expect(readStrokeWidthLabel()).toBe("2.5");

    await act(async () => {
      increaseButton?.click();
      increaseButton?.click();
      await flush();
    });

    expect(readStrokeWidthLabel()).toBe("3");
  });

  it("clamps strokeWidth updates to the configured bounds", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const strokeWidthInput =
      renderedApp.container.querySelector<HTMLInputElement>(
        'input[aria-label="Stroke width"]',
      );
    const decreaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Decrease stroke width"]',
      );

    await act(async () => {
      if (strokeWidthInput !== null) {
        changeFieldValue(strokeWidthInput, "99");
      }
      await flush();
    });

    expect(strokeWidthInput?.value).toBe("8");

    await act(async () => {
      for (let index = 0; index < 40; index += 1) {
        decreaseButton?.click();
      }
      await flush();
    });

    expect(strokeWidthInput?.value).toBe("0.5");
    expect(renderedApp.container.textContent).toContain("0.5");
  });
});
