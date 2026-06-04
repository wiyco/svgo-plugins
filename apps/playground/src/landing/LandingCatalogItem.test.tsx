import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingCatalogItem } from "./LandingCatalogItem";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const handleWarmup = vi.fn<() => void>();
  const linkRef = { current: null as HTMLAnchorElement | null };
  const usePlaygroundLinkWarmup = vi.fn<
    (slug: string) => {
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
    usePlaygroundLinkWarmup,
  };
});

vi.mock("./use-playground-link-warmup", () => {
  return {
    usePlaygroundLinkWarmup: mocks.usePlaygroundLinkWarmup,
  };
});

let container: HTMLDivElement;
let root: Root;

const HOIST_STROKE_WIDTH_PLAYGROUND = {
  href: "./svgo-plugin-hoist-stroke-width/",
  packageName: "@wiyco/svgo-plugin-hoist-stroke-width",
  presetCountLabel: "3 presets",
  slug: "svgo-plugin-hoist-stroke-width",
  summary:
    "Move uniform descendant stroke-width values to the root SVG element so SVGR-generated React icons can override them from props or CSS.",
  title: "Hoist Stroke Width",
} as const;

const CUSTOM_PLAYGROUND = {
  href: "./custom-playground/",
  packageName: null,
  presetCountLabel: "1 preset",
  slug: "custom-playground",
  summary: "Custom summary",
  title: "Custom title",
} as const;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  mocks.handleWarmup.mockReset();
  mocks.linkRef.current = null;
  mocks.usePlaygroundLinkWarmup.mockClear();
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

describe("LandingCatalogItem", () => {
  it("renders metadata and wires warmup handlers onto the link", async () => {
    await act(async () => {
      root.render(
        <ul>
          <LandingCatalogItem playground={HOIST_STROKE_WIDTH_PLAYGROUND} />
        </ul>,
      );
      await flush();
    });

    const playgroundLink = container.querySelector<HTMLAnchorElement>(
      'a[href="./svgo-plugin-hoist-stroke-width/"]',
    );
    if (playgroundLink === null) {
      throw new Error("Expected landing catalog link");
    }

    expect(mocks.usePlaygroundLinkWarmup).toHaveBeenCalledWith(
      "svgo-plugin-hoist-stroke-width",
    );
    expect(playgroundLink.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );
    expect(playgroundLink.textContent).toContain("3 presets");
    expect(playgroundLink.textContent).toContain("Hoist Stroke Width");
    expect(mocks.linkRef.current).toBe(playgroundLink);

    await act(async () => {
      playgroundLink.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true }),
      );
      playgroundLink.dispatchEvent(new Event("focusin", { bubbles: true }));
      await flush();
    });

    expect(mocks.handleWarmup).toHaveBeenCalledTimes(2);
  });

  it("omits the package chip when the package name is unavailable", async () => {
    await act(async () => {
      root.render(
        <ul>
          <LandingCatalogItem playground={CUSTOM_PLAYGROUND} />
        </ul>,
      );
      await flush();
    });

    expect(container.querySelector(".landing-item-package")).toBeNull();
    expect(container.textContent).toContain("1 preset");
    expect(container.textContent).not.toContain("1 presets");
  });
});
