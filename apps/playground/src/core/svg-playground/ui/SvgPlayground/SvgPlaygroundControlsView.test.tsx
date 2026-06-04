import { type RefObject, act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RippleHandlers } from "../use-press-ripple";
import type { CommandDockViewModel } from "./use-command-dock-view-model";

import { SvgPlaygroundControlsView } from "./SvgPlaygroundControlsView";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createRippleHandlers = (): RippleHandlers => {
  return {
    onBlur: vi.fn<NonNullable<RippleHandlers["onBlur"]>>(),
    onKeyDown: vi.fn<NonNullable<RippleHandlers["onKeyDown"]>>(),
    onPointerDown: vi.fn<NonNullable<RippleHandlers["onPointerDown"]>>(),
  };
};

const createCommandDockViewModel = (
  overrides: Partial<CommandDockViewModel> = {},
): CommandDockViewModel => {
  return {
    colorLabel: "#FF6600",
    colorSwatchStyle: {
      backgroundColor: "#ff6600",
    },
    controlsId: "command-controls",
    isExpanded: false,
    onSummaryClick: vi.fn<() => void>(),
    sizeLabel: "256px",
    strokeWidthLabel: "Stroke 3.5",
    summaryAriaLabel: "Expand playground controls",
    summaryButtonRef:
      createRef<HTMLButtonElement>() as RefObject<HTMLButtonElement | null>,
    ...overrides,
  };
};

const renderControlsView = async (
  commandDock: CommandDockViewModel,
  rippleHandlers = createRippleHandlers(),
) => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);

  await act(async () => {
    root.render(
      <SvgPlaygroundControlsView
        commandDock={commandDock}
        rippleHandlers={rippleHandlers}
      >
        <span data-command-control="body">Control body</span>
      </SvgPlaygroundControlsView>,
    );
    await flush();
  });

  return {
    container,
    rippleHandlers,
    root,
  };
};

let renderedTree: Awaited<ReturnType<typeof renderControlsView>> | null = null;

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

describe("SvgPlaygroundControlsView", () => {
  it("renders the collapsed command dock summary contract", async () => {
    const onSummaryClick = vi.fn<() => void>();
    const commandDock = createCommandDockViewModel({
      onSummaryClick,
    });
    renderedTree = await renderControlsView(commandDock);

    const commandDockElement =
      renderedTree.container.querySelector<HTMLElement>(".command-dock");
    const summaryButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        ".command-dock-summary",
      );
    const commandDetails = renderedTree.container.querySelector<HTMLElement>(
      ".command-dock-details",
    );
    const swatch = renderedTree.container.querySelector<HTMLElement>(
      ".command-dock-summary-swatch",
    );
    const detailsInner = renderedTree.container.querySelector<HTMLElement>(
      ".command-dock-details-inner",
    );

    expect(commandDockElement?.getAttribute("aria-label")).toBe(
      "Playground controls",
    );
    expect(commandDockElement?.getAttribute("data-expanded")).toBe("false");
    expect(summaryButton?.getAttribute("aria-controls")).toBe(
      "command-controls",
    );
    expect(summaryButton?.getAttribute("aria-expanded")).toBe("false");
    expect(summaryButton?.getAttribute("aria-label")).toBe(
      "Expand playground controls",
    );
    expect(summaryButton?.textContent).toContain("Stroke 3.5");
    expect(summaryButton?.textContent).toContain("256px");
    expect(summaryButton?.textContent).toContain("#FF6600");
    expect(swatch?.getAttribute("style")).toContain("background-color");
    expect(commandDetails?.id).toBe("command-controls");
    expect(detailsInner?.textContent).toBe("Control body");
    expect(commandDock.summaryButtonRef.current).toBe(summaryButton);

    await act(async () => {
      summaryButton?.click();
      summaryButton?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
      summaryButton?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Enter",
        }),
      );
      summaryButton?.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true }),
      );
      await flush();
    });

    expect(onSummaryClick).toHaveBeenCalledTimes(1);
    expect(renderedTree.rippleHandlers.onPointerDown).toHaveBeenCalledTimes(1);
    expect(renderedTree.rippleHandlers.onKeyDown).toHaveBeenCalledTimes(1);
    expect(renderedTree.rippleHandlers.onBlur).toHaveBeenCalledTimes(1);
  });

  it("renders the expanded command dock state", async () => {
    renderedTree = await renderControlsView(
      createCommandDockViewModel({
        isExpanded: true,
        summaryAriaLabel: "Collapse playground controls",
      }),
    );

    const commandDockElement =
      renderedTree.container.querySelector<HTMLElement>(".command-dock");
    const summaryButton =
      renderedTree.container.querySelector<HTMLButtonElement>(
        ".command-dock-summary",
      );

    expect(commandDockElement?.getAttribute("data-expanded")).toBe("true");
    expect(summaryButton?.getAttribute("aria-expanded")).toBe("true");
    expect(summaryButton?.getAttribute("aria-label")).toBe(
      "Collapse playground controls",
    );
  });
});
