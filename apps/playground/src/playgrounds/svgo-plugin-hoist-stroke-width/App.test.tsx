import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../../core/svg-playground/model";

import { SvgPlaygroundPage } from "../../core/svg-playground/ui/SvgPlaygroundPage";
import { hoistStrokeWidthPlayground } from "./definition";

type RenderedApp = {
  container: HTMLDivElement;
  root: Root;
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createSuccessResult = (presetName: "mixed" | "uniform") => {
  return {
    kind: "success" as const,
    optimizedSvg: `<svg data-optimized="${presetName}" />`,
    previewCode: `const SvgComponent = (props) => React.createElement("svg", { "data-preview": "${presetName}", ...props });`,
    reactSource: `const SvgComponent = (props) => <svg data-source="${presetName}" {...props} />;`,
  };
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

    const presetName = svg.includes('stroke-width="2.5"') ? "mixed" : "uniform";

    return createSuccessResult(presetName);
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

    const mixedPresetButton = Array.from(
      renderedApp.container.querySelectorAll<HTMLButtonElement>(
        ".preset-button",
      ),
    ).find((button) => {
      return button.textContent?.includes("Mixed Weights") ?? false;
    });

    await act(async () => {
      mixedPresetButton?.click();
      await flush();
    });

    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );
    const optimizedPanel = renderedApp.container.textContent;
    const previewSvg = renderedApp.container.querySelector<SVGSVGElement>(
      'svg[data-preview="mixed"]',
    );

    expect(textarea?.value).toContain('stroke-width="2.5"');
    expect(optimizedPanel).toContain('data-optimized="mixed"');
    expect(optimizedPanel).toContain('data-source="mixed"');
    expect(previewSvg).not.toBeNull();
  });

  it("ignores preset clicks when the clicked button has no preset id", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const mixedPresetButton = Array.from(
      renderedApp.container.querySelectorAll<HTMLButtonElement>(
        ".preset-button",
      ),
    ).find((button) => {
      return button.textContent?.includes("Mixed Weights") ?? false;
    });
    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );
    const initialSvg = textarea?.value;

    mixedPresetButton?.removeAttribute("data-preset-id");

    await act(async () => {
      mixedPresetButton?.click();
      await flush();
    });

    expect(textarea?.value).toBe(initialSvg);
    expect(textarea?.value).not.toContain('stroke-width="2.5"');
  });

  it("ignores preset clicks when the preset id does not exist", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const mixedPresetButton = Array.from(
      renderedApp.container.querySelectorAll<HTMLButtonElement>(
        ".preset-button",
      ),
    ).find((button) => {
      return button.textContent?.includes("Mixed Weights") ?? false;
    });
    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );
    const initialSvg = textarea?.value;

    mixedPresetButton?.setAttribute("data-preset-id", "missing-preset");

    await act(async () => {
      mixedPresetButton?.click();
      await flush();
    });

    expect(textarea?.value).toBe(initialSvg);
    expect(textarea?.value).not.toContain('stroke-width="2.5"');
  });

  it("loads its initial state from the query string and keeps the URL in sync", async () => {
    const serialized = hoistStrokeWidthPlayground.serializeState({
      color: "#0f766e",
      size: 240,
      strokeWidth: 3.5,
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" /></svg>`,
    });

    window.history.replaceState({}, "", `/?${serialized}`);
    renderedApp = await renderPlayground(createTransformStub());

    const colorInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="color"]',
    );

    expect(colorInput?.value).toBe("#0f766e");
    expect(renderedApp.container.textContent).toContain("240px");
    expect(renderedApp.container.textContent).toContain("3.5");
    expect(window.location.search).toBe(`?${serialized}`);

    await act(async () => {
      if (colorInput !== null) {
        changeFieldValue(colorInput, "#ff6600");
      }
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

  it("shows loading placeholders first and falls back to idle placeholders for empty input", async () => {
    let resolveTransform: () => void = () => undefined;
    const transform: TransformFn = async () => {
      await new Promise<void>((resolve) => {
        resolveTransform = resolve;
      });

      return {
        kind: "success",
        optimizedSvg: "<svg />",
        previewCode:
          'const SvgComponent = () => React.createElement("svg", null);',
        reactSource: "const SvgComponent = () => <svg />;",
      };
    };

    renderedApp = await renderPlayground(transform);

    expect(renderedApp.container.textContent).toContain(
      "Rebuilding optimized SVG",
    );
    expect(renderedApp.container.textContent).toContain(
      "Rebuilding React component source",
    );
    expect(renderedApp.container.textContent).toContain(
      "Rebuilding live preview",
    );

    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );

    await act(async () => {
      if (textarea !== null) {
        changeFieldValue(textarea, "   ");
      }
      await flush();
    });

    expect(renderedApp.container.textContent).toContain(
      "Paste or pick an SVG preset to begin.",
    );
    expect(renderedApp.container.textContent).toContain(
      "React source appears here after a successful transform.",
    );
    expect(renderedApp.container.textContent).toContain(
      "Choose a preset or paste SVG markup.",
    );

    resolveTransform();
  });

  it("shows a preview warning for unsafe svg input", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const unsafePresetButton = Array.from(
      renderedApp.container.querySelectorAll<HTMLButtonElement>(
        ".preset-button",
      ),
    ).find((button) => {
      return button.textContent?.includes("Unsafe Script") ?? false;
    });

    await act(async () => {
      unsafePresetButton?.click();
      await flush();
    });

    expect(renderedApp.container.textContent).toContain(
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

    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );
    const initialSvg = textarea?.value ?? "";

    await act(async () => {
      if (textarea !== null) {
        changeFieldValue(textarea, nextSvg);
      }
      await flush();
    });

    await act(async () => {
      pendingRequests.get(nextSvg)?.resolve(createSuccessResult("mixed"));
      await flush();
    });

    await act(async () => {
      pendingRequests.get(initialSvg)?.resolve(createSuccessResult("uniform"));
      await flush();
    });

    expect(renderedApp.container.textContent).toContain(
      'data-optimized="mixed"',
    );
    expect(
      renderedApp.container.querySelector<SVGSVGElement>(
        'svg[data-preview="mixed"]',
      ),
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

    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );
    const initialSvg = textarea?.value ?? "";

    await act(async () => {
      if (textarea !== null) {
        changeFieldValue(textarea, nextSvg);
      }
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

    expect(renderedApp.container.textContent).toContain(
      'data-optimized="mixed"',
    );
    expect(renderedApp.container.textContent).not.toContain("late failure");
  });

  it("shows transform error panels when the worker returns an error result", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const textarea = renderedApp.container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Input SVG"]',
    );

    await act(async () => {
      if (textarea !== null) {
        changeFieldValue(
          textarea,
          `<svg viewBox="0 0 24 24"><path d="broken-payload" /></svg>`,
        );
      }
      await flush();
    });

    expect(renderedApp.container.textContent).toContain("SVGO said no.");
    expect(
      renderedApp.container.querySelector('[role="alert"]')?.textContent,
    ).toContain("Transform failed.");
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

    const shareButton =
      renderedApp.container.querySelector<HTMLButtonElement>(".share-button");

    await act(async () => {
      shareButton?.click();
      await flush();
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(renderedApp.container.textContent).toContain("Share URL copied");
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

    expect(renderedApp.container.textContent).toContain(
      "Clipboard unavailable",
    );
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

    expect(renderedApp.container.textContent).toContain("Copy failed");
  });

  it("updates the live preview when strokeWidth, size, and color change", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const increaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Increase strokeWidth"]',
      );
    const sizeInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="size"]',
    );
    const colorInput = renderedApp.container.querySelector<HTMLInputElement>(
      'input[aria-label="color"]',
    );

    await act(async () => {
      increaseButton?.click();
      if (sizeInput !== null) {
        changeFieldValue(sizeInput, "256");
      }
      if (colorInput !== null) {
        changeFieldValue(colorInput, "#ff6600");
      }
      await flush();
    });

    const previewSvg = renderedApp.container.querySelector<SVGSVGElement>(
      'svg[data-preview="uniform"]',
    );

    expect(previewSvg?.getAttribute("stroke-width")).toBe("2.5");
    expect(previewSvg?.getAttribute("height")).toBe("256");
    expect(previewSvg?.getAttribute("width")).toBe("256");
    expect(previewSvg?.style.color).toBe("#ff6600");
  });

  it("clamps strokeWidth updates to the configured bounds", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const strokeWidthInput =
      renderedApp.container.querySelector<HTMLInputElement>(
        'input[aria-label="strokeWidth"]',
      );
    const decreaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Decrease strokeWidth"]',
      );

    await act(async () => {
      if (strokeWidthInput !== null) {
        changeFieldValue(strokeWidthInput, "99");
      }
      await flush();
    });

    expect(strokeWidthInput?.value).toBe("8");

    await act(async () => {
      for (let index = 0; index < 20; index += 1) {
        decreaseButton?.click();
      }
      await flush();
    });

    expect(strokeWidthInput?.value).toBe("0.5");
    expect(renderedApp.container.textContent).toContain("0.5");
  });
});
