import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LandingPageViewModel } from "./landing-page-view-model";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const presenterSpy =
    vi.fn<(props: { viewModel: LandingPageViewModel }) => void>();
  const createLandingPageViewModel =
    vi.fn<(catalog: readonly { slug: string }[]) => LandingPageViewModel>();

  return {
    createLandingPageViewModel,
    presenterSpy,
  };
});

vi.mock("./LandingPagePresenter", () => {
  return {
    LandingPagePresenter: (props: { viewModel: LandingPageViewModel }) => {
      mocks.presenterSpy(props);

      return <div data-slot="landing-page-presenter" />;
    },
  };
});

vi.mock("./landing-page-view-model", () => {
  return {
    createLandingPageViewModel: mocks.createLandingPageViewModel,
  };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.resetModules();
  mocks.createLandingPageViewModel.mockReset();
  mocks.presenterSpy.mockReset();
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

  vi.doUnmock("../playgrounds/catalog");
});

describe("LandingPage", () => {
  it("builds a view model from the catalog and passes it to the presenter", async () => {
    const catalog = [
      {
        packageName: "@scope/example-playground",
        presetCount: 2,
        slug: "example-playground",
        summary: "Example summary",
        title: "Example title",
      },
    ] as const;
    const viewModel: LandingPageViewModel = {
      playgroundCountLabel: "1 playground",
      playgrounds: [
        {
          href: "./example-playground/",
          packageName: "@scope/example-playground",
          presetCountLabel: "2 presets",
          slug: "example-playground",
          summary: "Example summary",
          title: "Example title",
        },
      ],
    };

    vi.doMock("../playgrounds/catalog", () => {
      return {
        PLAYGROUND_CATALOG: catalog,
      };
    });
    mocks.createLandingPageViewModel.mockReturnValue(viewModel);

    const { LandingPage } = await import("./LandingPage");

    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });

    expect(mocks.createLandingPageViewModel).toHaveBeenCalledTimes(1);
    expect(mocks.createLandingPageViewModel).toHaveBeenCalledWith(catalog);
    expect(mocks.presenterSpy).toHaveBeenCalledTimes(1);
    expect(mocks.presenterSpy).toHaveBeenCalledWith({ viewModel });
    expect(
      container.querySelector('[data-slot="landing-page-presenter"]'),
    ).not.toBeNull();
  });

  it("does not rebuild the static view model on rerender", async () => {
    const catalog = [
      {
        packageName: null,
        presetCount: 1,
        slug: "stable-playground",
        summary: "Stable summary",
        title: "Stable title",
      },
    ] as const;
    const viewModel: LandingPageViewModel = {
      playgroundCountLabel: "1 playground",
      playgrounds: [
        {
          href: "./stable-playground/",
          packageName: null,
          presetCountLabel: "1 preset",
          slug: "stable-playground",
          summary: "Stable summary",
          title: "Stable title",
        },
      ],
    };

    vi.doMock("../playgrounds/catalog", () => {
      return {
        PLAYGROUND_CATALOG: catalog,
      };
    });
    mocks.createLandingPageViewModel.mockReturnValue(viewModel);

    const { LandingPage } = await import("./LandingPage");

    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });
    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });

    expect(mocks.createLandingPageViewModel).toHaveBeenCalledTimes(1);
    expect(mocks.presenterSpy).toHaveBeenCalledTimes(2);
    expect(mocks.presenterSpy).toHaveBeenLastCalledWith({ viewModel });
  });
});
