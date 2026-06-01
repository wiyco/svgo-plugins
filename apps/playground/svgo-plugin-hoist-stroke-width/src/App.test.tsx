import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SvgPlayground } from "./App";
import type { TransformFn } from "./lib/types";

type RenderedApp = {
  container: HTMLDivElement;
  root: Root;
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createTransformStub = (): TransformFn => {
  return async ({ svg }) => {
    if (svg.includes("<script")) {
      return {
        kind: "unsafe",
        reason: "Script elements are blocked in the playground preview.",
      };
    }

    const presetName = svg.includes('stroke-width="2.5"') ? "mixed" : "uniform";

    return {
      kind: "success",
      optimizedSvg: `<svg data-optimized="${presetName}" />`,
      previewCode: `const SvgComponent = (props) => React.createElement("svg", { "data-preview": "${presetName}", ...props });`,
      reactSource: `const SvgComponent = (props) => <svg data-source="${presetName}" {...props} />;`,
    };
  };
};

const renderPlayground = async (
  transform: TransformFn,
): Promise<RenderedApp> => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);

  await act(async () => {
    root.render(<SvgPlayground transform={transform} />);
    await flush();
  });

  return {
    container,
    root,
  };
};

let renderedApp: RenderedApp | null = null;

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (renderedApp === null) {
    return;
  }

  await act(async () => {
    renderedApp?.root.unmount();
  });

  renderedApp = null;
});

describe("SvgPlayground", () => {
  it("updates all four panels when the preset changes", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const mixedPresetButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-pressed="false"]',
      );

    expect(mixedPresetButton?.textContent).toContain("Mixed Weights");

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

  it("updates the live preview when strokeWidth changes", async () => {
    renderedApp = await renderPlayground(createTransformStub());

    const increaseButton =
      renderedApp.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Increase strokeWidth"]',
      );

    await act(async () => {
      increaseButton?.click();
      await flush();
    });

    const previewSvg = renderedApp.container.querySelector<SVGSVGElement>(
      'svg[data-preview="uniform"]',
    );

    expect(previewSvg?.getAttribute("stroke-width")).toBe("2.5");
  });
});
