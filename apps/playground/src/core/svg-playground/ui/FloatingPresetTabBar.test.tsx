import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvgPreset } from "../model";

import {
  FloatingPresetTabBar,
  getNextPresetButton,
} from "./FloatingPresetTabBar";

type RenderedTabBar = {
  container: HTMLDivElement;
  root: Root;
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const TEST_PRESETS: readonly SvgPreset[] = [
  {
    id: "single-weight",
    label: "Single Weight",
    description: "A single effective stroke width.",
    svg: "<svg />",
  },
  {
    id: "multiple-weights",
    label: "Multiple Weights",
    description: "Several matching stroke widths.",
    svg: "<svg />",
  },
  {
    id: "mixed-weights",
    label: "Mixed Weights",
    description: "Conflicting stroke widths.",
    svg: "<svg />",
  },
  {
    id: "custom-safe-preset",
    label: "Custom Safe Preset",
    description: "A non-standard preset id.",
    svg: "<svg />",
  },
];

const renderTabBar = async ({
  activePresetId = "single-weight",
  presets = TEST_PRESETS,
  selectPreset = vi.fn<(presetId: string) => void>(),
}: {
  activePresetId?: string | null;
  presets?: readonly SvgPreset[];
  selectPreset?: ReturnType<typeof vi.fn<(presetId: string) => void>>;
} = {}): Promise<RenderedTabBar & { selectPreset: typeof selectPreset }> => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);

  await act(async () => {
    root.render(
      <FloatingPresetTabBar
        activePresetId={activePresetId}
        presets={presets}
        selectPreset={selectPreset}
      />,
    );
    await flush();
  });

  return {
    container,
    root,
    selectPreset,
  };
};

const getPresetButton = (
  container: HTMLElement,
  label: string,
): HTMLButtonElement | null => {
  return (
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(".preset-button"),
    ).find((button) => {
      return button.getAttribute("aria-label") === label;
    }) ?? null
  );
};

let renderedTabBar: RenderedTabBar | null = null;
const originalResizeObserver = globalThis.ResizeObserver;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

const setResizeObserver = (
  value: typeof globalThis.ResizeObserver | undefined,
): void => {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value,
  });
};

beforeEach(() => {
  document.body.innerHTML = "";
  setResizeObserver(originalResizeObserver);
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  setResizeObserver(originalResizeObserver);
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;

  if (renderedTabBar !== null) {
    await act(async () => {
      renderedTabBar?.root.unmount();
      await flush();
    });
  }

  renderedTabBar = null;
});

describe("FloatingPresetTabBar", () => {
  it("renders compact preset labels with semantic glyphs and a generic fallback glyph", async () => {
    renderedTabBar = await renderTabBar();

    const singleButton = getPresetButton(
      renderedTabBar.container,
      "Single Weight",
    );
    const multipleButton = getPresetButton(
      renderedTabBar.container,
      "Multiple Weights",
    );
    const mixedButton = getPresetButton(
      renderedTabBar.container,
      "Mixed Weights",
    );
    const customButton = getPresetButton(
      renderedTabBar.container,
      "Custom Safe Preset",
    );

    expect(singleButton?.textContent).toContain("Single");
    expect(singleButton?.querySelectorAll("path")).toHaveLength(1);
    expect(multipleButton?.textContent).toContain("Multiple");
    expect(multipleButton?.querySelectorAll("path")).toHaveLength(3);
    expect(mixedButton?.textContent).toContain("Mixed");
    expect(
      mixedButton?.querySelector('path[stroke-width="2.7"]'),
    ).not.toBeNull();
    expect(customButton?.textContent).toContain("Custom Safe Preset");
    expect(customButton?.querySelector("rect")).not.toBeNull();
  });

  it("forwards clicked preset ids and ignores clicks when the button lost its preset id", async () => {
    const selectPreset = vi.fn<(presetId: string) => void>();

    renderedTabBar = await renderTabBar({
      presets: TEST_PRESETS.slice(0, 2),
      selectPreset,
    });

    const singleButton = getPresetButton(
      renderedTabBar.container,
      "Single Weight",
    );
    const multipleButton = getPresetButton(
      renderedTabBar.container,
      "Multiple Weights",
    );

    await act(async () => {
      multipleButton?.click();
      await flush();
    });

    singleButton?.removeAttribute("data-preset-id");

    await act(async () => {
      singleButton?.click();
      await flush();
    });

    expect(selectPreset).toHaveBeenCalledTimes(1);
    expect(selectPreset).toHaveBeenCalledWith("multiple-weights");
  });

  it("treats the preset bar as a horizontal toolbar and keeps focused presets scrolled into view", async () => {
    const scrollIntoView = vi.fn<HTMLElement["scrollIntoView"]>();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderedTabBar = await renderTabBar({
      presets: TEST_PRESETS,
    });

    const presetBar = renderedTabBar.container.querySelector<HTMLElement>(
      ".floating-preset-tabbar",
    );
    const mixedButton = getPresetButton(
      renderedTabBar.container,
      "Mixed Weights",
    );

    mixedButton?.focus();

    expect(presetBar?.getAttribute("role")).toBe("toolbar");
    expect(presetBar?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(document.activeElement).toBe(mixedButton);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });

  it("moves keyboard focus across presets with arrow keys and home/end without selecting", async () => {
    const selectPreset = vi.fn<(presetId: string) => void>();

    renderedTabBar = await renderTabBar({
      presets: TEST_PRESETS,
      selectPreset,
    });

    const singleButton = getPresetButton(
      renderedTabBar.container,
      "Single Weight",
    );
    const multipleButton = getPresetButton(
      renderedTabBar.container,
      "Multiple Weights",
    );
    const mixedButton = getPresetButton(
      renderedTabBar.container,
      "Mixed Weights",
    );
    const customButton = getPresetButton(
      renderedTabBar.container,
      "Custom Safe Preset",
    );

    singleButton?.focus();
    singleButton?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "ArrowRight",
      }),
    );
    expect(document.activeElement).toBe(multipleButton);

    multipleButton?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "End",
      }),
    );
    expect(document.activeElement).toBe(customButton);

    customButton?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "ArrowLeft",
      }),
    );
    expect(document.activeElement).toBe(mixedButton);

    mixedButton?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Home",
      }),
    );
    expect(document.activeElement).toBe(singleButton);
    expect(selectPreset).not.toHaveBeenCalled();
  });

  it("ignores unsupported keys without moving focus or selecting", async () => {
    const selectPreset = vi.fn<(presetId: string) => void>();

    renderedTabBar = await renderTabBar({
      presets: TEST_PRESETS,
      selectPreset,
    });

    const multipleButton = getPresetButton(
      renderedTabBar.container,
      "Multiple Weights",
    );

    multipleButton?.focus();
    multipleButton?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Tab",
      }),
    );

    expect(document.activeElement).toBe(multipleButton);
    expect(selectPreset).not.toHaveBeenCalled();
  });

  it("returns undefined when keyboard navigation has no preset track", () => {
    const detachedButton = document.createElement("button");

    expect(
      getNextPresetButton({
        currentTarget: detachedButton,
        key: "ArrowRight",
        presetTrack: null,
      }),
    ).toBeUndefined();
  });

  it("returns undefined when the current button is not in the preset track", async () => {
    renderedTabBar = await renderTabBar({
      presets: TEST_PRESETS,
    });

    const detachedButton = document.createElement("button");
    const presetTrack = renderedTabBar.container.querySelector(
      ".floating-preset-tabbar-track",
    );

    expect(
      getNextPresetButton({
        currentTarget: detachedButton,
        key: "ArrowRight",
        presetTrack,
      }),
    ).toBeUndefined();
  });

  it("omits the selection indicator when no preset is active", async () => {
    renderedTabBar = await renderTabBar({
      activePresetId: null,
      presets: TEST_PRESETS.slice(0, 3),
    });

    expect(
      renderedTabBar.container.querySelector(
        ".floating-preset-selection-indicator",
      ),
    ).toBeNull();
  });

  it("omits the selection indicator when the active preset is hidden from the bar", async () => {
    renderedTabBar = await renderTabBar({
      activePresetId: "unsafe-script",
      presets: TEST_PRESETS.slice(0, 3),
    });

    expect(
      renderedTabBar.container.querySelector(
        ".floating-preset-selection-indicator",
      ),
    ).toBeNull();
  });

  it("renders the selection indicator without ResizeObserver support", async () => {
    setResizeObserver(undefined);
    renderedTabBar = await renderTabBar({
      activePresetId: "single-weight",
      presets: TEST_PRESETS.slice(0, 3),
    });

    expect(
      renderedTabBar.container.querySelector(
        ".floating-preset-selection-indicator",
      ),
    ).not.toBeNull();
  });

  it("recomputes the selection indicator when ResizeObserver fires", async () => {
    const resizeObserverCallbacks: Array<() => void> = [];

    class ResizeObserverMock {
      callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        resizeObserverCallbacks.push(() => {
          this.callback([], this as unknown as ResizeObserver);
        });
      }

      observe(): void {}

      disconnect(): void {}
    }

    setResizeObserver(
      ResizeObserverMock as unknown as typeof globalThis.ResizeObserver,
    );
    renderedTabBar = await renderTabBar({
      activePresetId: "single-weight",
      presets: TEST_PRESETS.slice(0, 3),
    });

    const activeButton =
      renderedTabBar.container.querySelector<HTMLButtonElement>(
        '[data-preset-id="single-weight"]',
      );

    if (activeButton !== null) {
      Object.defineProperties(activeButton, {
        offsetHeight: {
          configurable: true,
          get: () => 52,
        },
        offsetLeft: {
          configurable: true,
          get: () => 24,
        },
        offsetTop: {
          configurable: true,
          get: () => 6,
        },
        offsetWidth: {
          configurable: true,
          get: () => 88,
        },
      });
    }

    await act(async () => {
      resizeObserverCallbacks[0]?.();
      await flush();
    });

    const indicator = renderedTabBar.container.querySelector<HTMLElement>(
      ".floating-preset-selection-indicator",
    );

    expect(resizeObserverCallbacks).toHaveLength(1);
    expect(indicator).not.toBeNull();
    expect(
      indicator?.style.getPropertyValue("--floating-preset-selection-height"),
    ).toBe("52px");
    expect(
      indicator?.style.getPropertyValue("--floating-preset-selection-width"),
    ).toBe("88px");
    expect(
      indicator?.style.getPropertyValue("--floating-preset-selection-x"),
    ).toBe("24px");
    expect(
      indicator?.style.getPropertyValue("--floating-preset-selection-y"),
    ).toBe("6px");
  });
});
