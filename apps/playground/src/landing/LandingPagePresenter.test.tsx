import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LandingCatalogItemViewModel } from "./landing-page-view-model";

import { LandingPagePresenter } from "./LandingPagePresenter";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const itemSpy =
    vi.fn<(props: { playground: LandingCatalogItemViewModel }) => void>();

  return {
    itemSpy,
  };
});

vi.mock("./LandingCatalogItem", () => {
  return {
    LandingCatalogItem: (props: {
      playground: LandingCatalogItemViewModel;
    }) => {
      mocks.itemSpy(props);

      return <li data-playground-slug={props.playground.slug} />;
    },
  };
});

let container: HTMLDivElement;
let root: Root;

const PRESENTER_PLAYGROUNDS = [
  {
    href: "./first/",
    packageName: "@scope/first",
    presetCountLabel: "2 presets",
    slug: "first",
    summary: "First summary",
    title: "First title",
  },
  {
    href: "./second/",
    packageName: null,
    presetCountLabel: "1 preset",
    slug: "second",
    summary: "Second summary",
    title: "Second title",
  },
] as const;

const PRESENTER_VIEW_MODEL = {
  playgrounds: PRESENTER_PLAYGROUNDS,
};

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  mocks.itemSpy.mockReset();
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

describe("LandingPagePresenter", () => {
  it("renders the landing chrome and delegates each catalog item", async () => {
    await act(async () => {
      root.render(<LandingPagePresenter viewModel={PRESENTER_VIEW_MODEL} />);
      await flush();
    });

    expect(container.textContent).toContain("SVGO Plugin Playground");
    expect(container.textContent).toContain(
      "Test focused SVGO plugins against real SVG input",
    );
    expect(container.textContent).toContain("Plugin playgrounds");
    expect(mocks.itemSpy).toHaveBeenCalledTimes(2);
    expect(mocks.itemSpy.mock.calls[0]?.[0]).toEqual({
      playground: PRESENTER_PLAYGROUNDS[0],
    });
    expect(mocks.itemSpy.mock.calls[1]?.[0]).toEqual({
      playground: PRESENTER_PLAYGROUNDS[1],
    });
    expect(container.querySelectorAll("li[data-playground-slug]")).toHaveLength(
      2,
    );
  });
});
