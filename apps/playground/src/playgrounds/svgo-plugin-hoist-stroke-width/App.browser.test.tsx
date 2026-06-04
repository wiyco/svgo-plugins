import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import "../../index.css";
import App from "./App";

const LOADING_MESSAGES = [
  "Rebuilding live preview…",
  "Rebuilding optimized SVG…",
  "Rebuilding React component source…",
] as const;

const UNSAFE_SVG =
  '<svg viewBox="0 0 24 24"><script>alert("blocked")</script></svg>';

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const waitForPanelsToSettle = async (): Promise<void> => {
  await expect
    .poll(() => {
      const previewLabel = document
        .querySelector(".preview-render svg")
        ?.getAttribute("aria-label");
      const reactSource = document.querySelector(
        ".panel-react .code-panel",
      )?.textContent;
      const textContent = document.body.textContent ?? "";

      return {
        hasLoadingMessage: LOADING_MESSAGES.some((message) => {
          return textContent.includes(message);
        }),
        previewLabel,
        reactSourceReady: reactSource?.startsWith(
          "const SvgComponent = (props) => (",
        ),
      };
    })
    .toEqual({
      hasLoadingMessage: false,
      previewLabel: "Live preview",
      reactSourceReady: true,
    });
};

const waitForCodeSurfacesToLoad = async (): Promise<void> => {
  await expect
    .poll(() => {
      return {
        hasHighlightedTokens:
          document.querySelectorAll(
            '[data-code-surface="codemirror"] .cm-content span[class]',
          ).length > 0,
        loadedSurfaceCount: document.querySelectorAll(
          '[data-code-surface="codemirror"] .cm-editor',
        ).length,
      };
    })
    .toEqual({
      hasHighlightedTokens: true,
      loadedSurfaceCount: 3,
    });
};

const readReactSourceTokenColors = () => {
  const tokenContainer = document.querySelector(
    '[data-language="jsx"] .cm-content',
  );
  const tokenElements = Array.from(
    tokenContainer?.querySelectorAll("span") ?? [],
  );
  const readColors = (tokenText: string) => {
    return tokenElements
      .filter((element) => {
        return element.textContent === tokenText;
      })
      .map((element) => {
        return getComputedStyle(element).color;
      });
  };
  const readFirstColor = (tokenText: string) => {
    const tokenColor = readColors(tokenText)[0];

    if (tokenColor === undefined) {
      return null;
    }

    return tokenColor;
  };

  return {
    closeParen: readFirstColor(")"),
    componentName: readFirstColor("SvgComponent"),
    equals: readFirstColor("="),
    openParen: readFirstColor("("),
    props: readColors("props"),
  };
};

let root: Root | null = null;

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (root !== null) {
    await act(async () => {
      root?.unmount();
      await flush();
    });
  }

  root = null;
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
  await page.viewport(960, 720);
});

describe("playground browser worker regression", () => {
  it("settles all panels after booting the real transform worker", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
      await flush();
    });

    await expect
      .element(
        page.getByText("SVGO plugin playground for hoisting stroke width"),
      )
      .toBeInTheDocument();
    await waitForPanelsToSettle();
    await waitForCodeSurfacesToLoad();
    expect(readReactSourceTokenColors()).toEqual({
      closeParen: "rgb(108, 108, 112)",
      componentName: "rgb(176, 47, 194)",
      equals: "rgb(197, 83, 0)",
      openParen: "rgb(108, 108, 112)",
      props: ["rgb(176, 47, 194)", "rgb(0, 126, 174)"],
    });
  });

  it("shows unsafe state instead of hanging when script markup is pasted", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
      await flush();
    });

    await waitForPanelsToSettle();
    await waitForCodeSurfacesToLoad();
    await page.getByLabelText("Input SVG").fill(UNSAFE_SVG);

    await expect
      .element(page.getByText("Preview disabled for unsafe SVG input."))
      .toBeInTheDocument();
    await expect
      .poll(() => {
        return document.querySelector(".share-button-text")?.textContent;
      })
      .toBe("Sharing unavailable");
    await expect
      .poll(() => {
        const textContent = document.body.textContent ?? "";

        return LOADING_MESSAGES.some((message) => {
          return textContent.includes(message);
        });
      })
      .toBe(false);
  });

  it("keeps the command dock compact above presets on an iPhone-width viewport", async () => {
    await page.viewport(390, 844);

    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
      await flush();
    });

    await waitForPanelsToSettle();

    const commandDock = document.querySelector<HTMLElement>(".command-dock");
    const commandSummary = document.querySelector<HTMLElement>(
      ".command-dock-summary",
    );
    const commandDetails = document.querySelector<HTMLElement>(
      ".command-dock-details",
    );
    const commandDetailsInner = document.querySelector<HTMLElement>(
      ".command-dock-details-inner",
    );
    const commandGear = document.querySelector<SVGElement>(
      ".command-dock-summary-icon svg",
    );
    const commandChevron = document.querySelector<SVGElement>(
      ".command-dock-summary-chevron svg",
    );
    const presetBar = document.querySelector<HTMLElement>(
      ".floating-preset-tabbar",
    );

    if (
      commandDock === null ||
      commandSummary === null ||
      commandDetails === null ||
      commandDetailsInner === null ||
      commandGear === null ||
      commandChevron === null ||
      presetBar === null
    ) {
      throw new Error("Expected mobile command dock and preset bar.");
    }

    await expect
      .poll(() => {
        return window.matchMedia("(max-width: 720px)").matches;
      })
      .toBe(true);
    await expect
      .poll(() => {
        return getComputedStyle(commandDock).position;
      })
      .toBe("fixed");
    await expect
      .poll(() => {
        return getComputedStyle(commandSummary).display;
      })
      .toBe("flex");
    await expect
      .poll(() => {
        return getComputedStyle(commandDetails).display;
      })
      .toBe("grid");
    await expect
      .poll(() => {
        return getComputedStyle(commandDetails).visibility;
      })
      .toBe("hidden");
    await expect
      .poll(() => {
        return commandDetails.getBoundingClientRect().height;
      })
      .toBeLessThan(1);
    await expect
      .poll(() => {
        return commandDock.getBoundingClientRect().height;
      })
      .toBeLessThan(window.innerHeight * 0.2);
    expect(getComputedStyle(commandGear).transform).toBe("none");
    expect(getComputedStyle(commandChevron).transform).toBe("none");
    expect(getComputedStyle(commandDetails).transitionProperty).toContain(
      "grid-template-rows",
    );
    expect(getComputedStyle(commandDetailsInner).transitionProperty).toContain(
      "transform",
    );

    const collapsedDockRect = commandDock.getBoundingClientRect();
    const presetBarRect = presetBar.getBoundingClientRect();

    expect(collapsedDockRect.bottom).toBeLessThanOrEqual(presetBarRect.top - 4);

    await act(async () => {
      await page.getByLabelText("Expand playground controls").click();
      await flush();
    });

    await expect
      .poll(() => {
        return commandDock.dataset.expanded;
      })
      .toBe("true");
    await expect
      .poll(() => {
        return getComputedStyle(commandDetails).visibility;
      })
      .toBe("visible");
    await expect
      .poll(() => {
        return commandDetails.getBoundingClientRect().height;
      })
      .toBeGreaterThan(1);
    await expect
      .poll(() => {
        return getComputedStyle(commandDetailsInner).opacity;
      })
      .toBe("1");
    expect(getComputedStyle(commandGear).transform).not.toBe("none");
    expect(getComputedStyle(commandChevron).transform).not.toBe("none");
    await expect
      .poll(() => {
        return commandDock.getBoundingClientRect().height;
      })
      .toBeLessThan(window.innerHeight * 0.56);
  });
});
