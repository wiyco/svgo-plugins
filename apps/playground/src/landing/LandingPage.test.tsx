import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.resetModules();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });

  vi.doUnmock("../playgrounds/registry");
});

describe("LandingPage", () => {
  it("renders the compact slug registry", async () => {
    const { LandingPage } = await import("./LandingPage");

    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });

    const playgroundLink = container.querySelector<HTMLAnchorElement>(
      'a[href="./svgo-plugin-hoist-stroke-width/"]',
    );
    const meta = container.querySelector<HTMLElement>(".landing-item-meta");
    const slugChip = container.querySelector<HTMLElement>(".landing-item-slug");
    const title = container.querySelector<HTMLElement>(".landing-item-title");
    const presetCount = container.querySelector<HTMLElement>(
      ".landing-item-count",
    );

    expect(container.textContent).toContain("Slug registry");
    expect(playgroundLink?.textContent).toContain(
      "svgo-plugin-hoist-stroke-width",
    );
    expect(playgroundLink?.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );
    expect(playgroundLink?.textContent).toContain("3 presets");
    expect(playgroundLink?.textContent).toContain(
      "Try the hoist-stroke-width plugin",
    );
    expect(container.textContent).toContain("Open a slug to paste SVG");
    expect(container.querySelector(".landing-kicker")).toBeNull();
    expect(slugChip?.getAttribute("data-view-transition-name")).toContain(
      "playground-slug-svgo-plugin-hoist-stroke-width",
    );
    expect(title?.getAttribute("data-view-transition-name")).toContain(
      "playground-title-svgo-plugin-hoist-stroke-width",
    );
    expect(meta?.contains(presetCount ?? null)).toBe(true);
    expect(container.querySelector(".landing-item-arrow")).toBeNull();
  });

  it("uses the singular preset label and omits the package chip when no mapping exists", async () => {
    vi.doMock("../playgrounds/registry", () => {
      return {
        PLAYGROUNDS: [
          {
            defaultState: {
              color: "#000000",
              size: 128,
              strokeWidth: 2,
              svg: "<svg />",
            },
            presets: [
              {
                id: "single-safe-preset",
                label: "Single Safe Preset",
                svg: "<svg viewBox='0 0 24 24' />",
              },
            ],
            serializeState: () => "",
            slug: "custom-playground",
            summary: "A custom playground summary",
            title: "Custom playground",
          },
        ],
        getPlaygroundPackageName: () => {
          return null;
        },
      };
    });

    const { LandingPage } = await import("./LandingPage");

    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });

    const playgroundLink = container.querySelector<HTMLAnchorElement>(
      'a[href="./custom-playground/"]',
    );

    expect(playgroundLink?.textContent).toContain("1 preset");
    expect(playgroundLink?.textContent).not.toContain("1 presets");
    expect(container.querySelector(".landing-item-package")).toBeNull();
  });
});
