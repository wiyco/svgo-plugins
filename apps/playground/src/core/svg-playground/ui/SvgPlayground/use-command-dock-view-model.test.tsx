import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type CommandDockViewModel,
  useCommandDockViewModel,
} from "./use-command-dock-view-model";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const renderCommandDockViewModel = async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  let currentViewModel: CommandDockViewModel | null = null;

  function Probe() {
    const commandDock = useCommandDockViewModel({
      color: "#ff6600",
      size: 255.7,
      strokeWidth: 3.5,
    });

    currentViewModel = commandDock;

    return (
      <button
        ref={commandDock.summaryButtonRef}
        type="button"
        onClick={commandDock.onSummaryClick}
      >
        Summary
      </button>
    );
  }

  document.body.append(container);

  await act(async () => {
    root.render(<Probe />);
    await flush();
  });

  return {
    container,
    get current() {
      if (currentViewModel === null) {
        throw new Error("Expected command dock view model to render.");
      }

      return currentViewModel;
    },
    root,
  };
};

let renderedTree: Awaited<
  ReturnType<typeof renderCommandDockViewModel>
> | null = null;

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

describe("useCommandDockViewModel", () => {
  it("formats the compact command dock summary", async () => {
    renderedTree = await renderCommandDockViewModel();

    expect(renderedTree.current.colorLabel).toBe("#FF6600");
    expect(renderedTree.current.colorSwatchStyle).toEqual({
      backgroundColor: "#ff6600",
    });
    expect(renderedTree.current.controlsId).not.toBe("");
    expect(renderedTree.current.isExpanded).toBe(false);
    expect(renderedTree.current.sizeLabel).toBe("256px");
    expect(renderedTree.current.strokeWidthLabel).toBe("Stroke 3.5");
    expect(renderedTree.current.summaryAriaLabel).toBe(
      "Expand playground controls",
    );
  });

  it("toggles expansion and only closes from Escape", async () => {
    renderedTree = await renderCommandDockViewModel();

    await act(async () => {
      renderedTree?.current.onSummaryClick();
      await flush();
    });

    expect(renderedTree.current.isExpanded).toBe(true);
    expect(renderedTree.current.summaryAriaLabel).toBe(
      "Collapse playground controls",
    );

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
        }),
      );
      await flush();
    });

    expect(renderedTree.current.isExpanded).toBe(true);

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
        }),
      );
      await flush();
    });

    expect(renderedTree.current.isExpanded).toBe(false);
    expect(document.activeElement).toBe(
      renderedTree.container.querySelector("button"),
    );
  });
});
