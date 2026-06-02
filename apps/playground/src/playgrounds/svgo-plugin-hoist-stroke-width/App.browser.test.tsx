import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

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
});
