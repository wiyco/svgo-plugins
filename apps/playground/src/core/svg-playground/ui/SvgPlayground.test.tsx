import { type ReactNode, act, createRef } from "react";
import { type Root, createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvgPlaygroundRootProps } from "./SvgPlayground/SvgPlaygroundContext";
import type { RippleHandlers } from "./use-press-ripple";
import type { UseShareButtonResult } from "./use-share-button";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlayground } from "./SvgPlayground/SvgPlayground";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
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

const createRippleHandlers = (): RippleHandlers => {
  return {
    onBlur: vi.fn<NonNullable<RippleHandlers["onBlur"]>>(),
    onKeyDown: vi.fn<NonNullable<RippleHandlers["onKeyDown"]>>(),
    onPointerDown: vi.fn<NonNullable<RippleHandlers["onPointerDown"]>>(),
  };
};

const createShareButton = (
  overrides: Partial<UseShareButtonResult> = {},
): UseShareButtonResult => {
  return {
    shareAnnouncement: "",
    shareButtonIcon: <span aria-hidden="true">link</span>,
    shareButtonLabel: "Copy share URL",
    shareButtonLabelRef: createRef<HTMLSpanElement>(),
    shareButtonMeasureRef: createRef<HTMLSpanElement>(),
    shareButtonRef: createRef<HTMLButtonElement>(),
    shareButtonState: "idle",
    shareButtonStyle: {},
    ...overrides,
  };
};

const createRootProps = (
  overrides: Partial<SvgPlaygroundRootProps> = {},
): SvgPlaygroundRootProps => {
  return {
    activePresetId: "single-weight",
    canShareUrl: true,
    color: "#155eef",
    copyShareUrl: vi.fn<() => void>(),
    inputSvg:
      '<svg viewBox="0 0 24 24"><path d="M5 12H19" stroke="currentColor" /></svg>',
    packageName: "@wiyco/svgo-plugin-hoist-stroke-width",
    previewHtml: { __html: '<svg data-preview="yes"></svg>' },
    reactSourceState: {
      error: "",
      source: "export const Icon = () => <svg />;",
    },
    rippleHandlers: createRippleHandlers(),
    selectPreset: vi.fn<(presetId: string) => void>(),
    setColor: vi.fn<(color: string) => void>(),
    setSize: vi.fn<(size: number) => void>(),
    setStrokeWidth: vi.fn<(strokeWidth: number) => void>(),
    setSvg: vi.fn<(svg: string) => void>(),
    shareButton: createShareButton(),
    size: 128,
    slug: hoistStrokeWidthPlayground.slug,
    stepStrokeWidth: vi.fn<(delta: number) => void>(),
    strokeWidth: 2,
    title: hoistStrokeWidthPlayground.title,
    transformState: {
      kind: "success",
      optimizedSvg: '<svg data-optimized="yes"></svg>',
    },
    visiblePresets: hoistStrokeWidthPlayground.presets,
    ...overrides,
  };
};

const renderCompound = async (
  props: SvgPlaygroundRootProps,
  children: ReactNode,
) => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);

  await act(async () => {
    root.render(<SvgPlayground.Root {...props}>{children}</SvgPlayground.Root>);
    await flush();
  });

  return {
    container,
    root,
  };
};

let renderedTree: { container: HTMLDivElement; root: Root } | null = null;

beforeEach(() => {
  document.body.innerHTML = "";
  renderedTree = null;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (renderedTree !== null) {
    await act(async () => {
      renderedTree?.root.unmount();
      await flush();
    });
  }

  renderedTree = null;
});

describe("SvgPlayground compound components", () => {
  it("throws when a compound subcomponent renders outside SvgPlayground.Root", () => {
    expect(() => {
      renderToStaticMarkup(<SvgPlayground.Header />);
    }).toThrow("SvgPlayground.Header must be used within SvgPlayground.Root.");
  });

  it("renders header and preset bar with the existing share and preset behavior", async () => {
    const copyShareUrl = vi.fn<() => void>();
    const selectPreset = vi.fn<(presetId: string) => void>();

    renderedTree = await renderCompound(
      createRootProps({
        copyShareUrl,
        selectPreset,
        shareButton: createShareButton({
          shareAnnouncement: "Copied.",
          shareButtonState: "success",
        }),
      }),
      <>
        <SvgPlayground.Header />
        <SvgPlayground.PresetBar />
      </>,
    );

    const shareButton =
      renderedTree.container.querySelector<HTMLButtonElement>(".share-button");
    const slugChip =
      renderedTree.container.querySelector<HTMLAnchorElement>(".slug-chip");
    const packageChip =
      renderedTree.container.querySelector<HTMLElement>(".package-chip");
    const singlePresetButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Single Weight"]',
      );
    const multiplePresetButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Multiple Weights"]',
      );

    expect(shareButton?.getAttribute("data-share-feedback-state")).toBe(
      "success",
    );
    expect(
      renderedTree.container.querySelector<HTMLElement>(".share-button-text")
        ?.textContent,
    ).toBe("Copy share URL");
    expect(
      renderedTree.container.querySelector<HTMLElement>('[aria-live="polite"]')
        ?.textContent,
    ).toBe("Copied.");
    expect(slugChip?.getAttribute("href")).toBe("../");
    expect(packageChip?.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );
    expect(singlePresetButton?.getAttribute("aria-pressed")).toBe("true");
    expect(multiplePresetButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      shareButton?.click();
      multiplePresetButton?.click();
      await flush();
    });

    expect(copyShareUrl).toHaveBeenCalledTimes(1);
    expect(selectPreset).toHaveBeenCalledWith("multiple-weights");
  });

  it("wires the compound controls to the existing callbacks", async () => {
    const setColor = vi.fn<(color: string) => void>();
    const setSize = vi.fn<(size: number) => void>();
    const setStrokeWidth = vi.fn<(strokeWidth: number) => void>();
    const stepStrokeWidth = vi.fn<(delta: number) => void>();

    renderedTree = await renderCompound(
      createRootProps({
        setColor,
        setSize,
        setStrokeWidth,
        stepStrokeWidth,
      }),
      <SvgPlayground.Controls />,
    );

    const decreaseButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Decrease stroke width"]',
      );
    const increaseButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Increase stroke width"]',
      );
    const strokeWidthInput =
      renderedTree.container.querySelector<HTMLInputElement>(
        'input[aria-label="Stroke width"]',
      );
    const sizeInput = renderedTree.container.querySelector<HTMLInputElement>(
      'input[aria-label="Size"]',
    );
    const colorInput = renderedTree.container.querySelector<HTMLInputElement>(
      'input[aria-label="Color"]',
    );

    await act(async () => {
      if (strokeWidthInput !== null) {
        changeFieldValue(strokeWidthInput, "3.5");
      }

      if (sizeInput !== null) {
        changeFieldValue(sizeInput, "256");
      }

      if (colorInput !== null) {
        changeFieldValue(colorInput, "#ff6600");
      }

      decreaseButton?.click();
      increaseButton?.click();
      await flush();
    });

    expect(setStrokeWidth).toHaveBeenCalledWith(3.5);
    expect(setSize).toHaveBeenCalledWith(256);
    expect(setColor).toHaveBeenCalledWith("#ff6600");
    expect(stepStrokeWidth).toHaveBeenNthCalledWith(1, -0.25);
    expect(stepStrokeWidth).toHaveBeenNthCalledWith(2, 0.25);
  });

  it("renders the success panels with preview, optimized SVG, and React source", async () => {
    renderedTree = await renderCompound(
      createRootProps(),
      <SvgPlayground.Panels />,
    );

    expect(
      renderedTree.container.querySelector(
        '.preview-render svg[data-preview="yes"]',
      ),
    ).not.toBeNull();
    expect(
      renderedTree.container.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="Input SVG"]',
      )?.value,
    ).toContain("<svg");
    expect(renderedTree.container.textContent).toContain(
      'data-optimized="yes"',
    );
    expect(renderedTree.container.textContent).toContain(
      "export const Icon = () => <svg />;",
    );
  });

  it("renders loading panel fallbacks", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        previewHtml: null,
        reactSourceState: {
          error: "",
          source: "",
        },
        transformState: {
          kind: "loading",
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain(
      "Rebuilding live preview…",
    );
    expect(renderedTree.container.textContent).toContain(
      "Rebuilding optimized SVG…",
    );
    expect(renderedTree.container.textContent).toContain(
      "Rebuilding React component source…",
    );
  });

  it("renders a React source fallback while deferred source generation is still pending", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        reactSourceState: {
          error: "",
          isPending: true,
          source: "",
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain(
      "Rebuilding React component source…",
    );
    expect(renderedTree.container.textContent).not.toContain(
      "export const Icon = () => <svg />;",
    );
  });

  it("renders unsafe panel fallbacks", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        previewHtml: null,
        reactSourceState: {
          error: "",
          source: "",
        },
        transformState: {
          kind: "unsafe",
          message: "Script elements are blocked.",
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain(
      "Preview disabled for unsafe SVG input.",
    );
    expect(renderedTree.container.textContent).toContain(
      "Script elements are blocked.",
    );
  });

  it("keeps optimized svg visible when transform output is downgraded to unsafe", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        previewHtml: null,
        reactSourceState: {
          error: "",
          source: "",
        },
        transformState: {
          kind: "unsafe",
          message: "Remote URLs are blocked.",
          optimizedSvg: '<svg data-optimized="unsafe"></svg>',
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain(
      'data-optimized="unsafe"',
    );
    expect(renderedTree.container.textContent).toContain(
      "Remote URLs are blocked.",
    );
  });

  it("renders error panel fallbacks", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        previewHtml: null,
        reactSourceState: {
          error: "",
          source: "",
        },
        transformState: {
          kind: "error",
          message: "SVGO said no.",
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain("Transform failed.");
    expect(renderedTree.container.textContent).toContain("SVGO said no.");
  });

  it("renders idle panel fallbacks", async () => {
    renderedTree = await renderCompound(
      createRootProps({
        previewHtml: null,
        reactSourceState: {
          error: "",
          source: "",
        },
        transformState: {
          kind: "idle",
        },
      }),
      <SvgPlayground.Panels />,
    );

    expect(renderedTree.container.textContent).toContain(
      "Choose a preset or paste SVG markup.",
    );
    expect(renderedTree.container.textContent).toContain(
      "Paste or pick an SVG preset to begin.",
    );
    expect(renderedTree.container.textContent).toContain(
      "React source appears here after a successful transform.",
    );
  });
});
