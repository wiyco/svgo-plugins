import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SvgPlaygroundIntro } from "./SvgPlaygroundHeader";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const handleWarmup = vi.fn<() => void>();
  const linkRef = { current: null as HTMLAnchorElement | null };
  const useLandingLinkWarmup = vi.fn<
    () => {
      handleWarmup: typeof handleWarmup;
      linkRef: typeof linkRef;
    }
  >(() => {
    return {
      handleWarmup,
      linkRef,
    };
  });

  return {
    handleWarmup,
    linkRef,
    useLandingLinkWarmup,
  };
});

vi.mock("./use-landing-link-warmup", () => {
  return {
    useLandingLinkWarmup: mocks.useLandingLinkWarmup,
  };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  mocks.handleWarmup.mockReset();
  mocks.linkRef.current = null;
  mocks.useLandingLinkWarmup.mockClear();
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });
});

describe("SvgPlaygroundIntro", () => {
  it("renders metadata and wires landing warmup handlers onto the slug chip", async () => {
    await act(async () => {
      root.render(
        <SvgPlaygroundIntro
          packageName="@wiyco/svgo-plugin-hoist-stroke-width"
          slug="svgo-plugin-hoist-stroke-width"
          title="Hoist Stroke Width"
        />,
      );
      await flush();
    });

    const slugChip = container.querySelector<HTMLAnchorElement>(".slug-chip");
    const packageChip = container.querySelector<HTMLElement>(".package-chip");

    if (slugChip === null) {
      throw new Error("Expected slug chip");
    }

    expect(mocks.useLandingLinkWarmup).toHaveBeenCalledTimes(1);
    expect(slugChip.getAttribute("href")).toBe("../");
    expect(slugChip.textContent).toContain("/svgo-plugin-hoist-stroke-width");
    expect(packageChip?.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );
    expect(mocks.linkRef.current).toBe(slugChip);

    await act(async () => {
      slugChip.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true }),
      );
      slugChip.dispatchEvent(new Event("focusin", { bubbles: true }));
      await flush();
    });

    expect(mocks.handleWarmup).toHaveBeenCalledTimes(2);
  });
});
