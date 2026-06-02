import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlaygroundLinkWarmup } from "./use-playground-link-warmup";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const warmPlaygroundRoute = vi.fn<(slug: string) => Promise<void>>();

  return {
    warmPlaygroundRoute,
  };
});

vi.mock("../playgrounds/preload-registry", () => {
  return {
    warmPlaygroundRoute: mocks.warmPlaygroundRoute,
  };
});

type HarnessState = ReturnType<typeof usePlaygroundLinkWarmup>;

const Harness = (props: { slug: string }) => {
  latestHarnessState = usePlaygroundLinkWarmup(props.slug);

  return (
    <a ref={latestHarnessState.linkRef} href={`./${props.slug}/`}>
      Open {props.slug}
    </a>
  );
};

let container: HTMLDivElement;
let root: Root;
let latestHarnessState: HarnessState | null = null;

beforeEach(() => {
  mocks.warmPlaygroundRoute.mockReset();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  latestHarnessState = null;
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: undefined,
  });
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

describe("use-playground-link-warmup", () => {
  it("warms the route when the returned handler is invoked", async () => {
    await act(async () => {
      root.render(<Harness slug="svgo-plugin-hoist-stroke-width" />);
      await flush();
    });

    if (latestHarnessState === null) {
      throw new Error("Expected warmup hook state");
    }
    const harnessState = latestHarnessState;

    await act(async () => {
      harnessState.handleWarmup();
      await flush();
    });

    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledTimes(1);
    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledWith(
      "svgo-plugin-hoist-stroke-width",
    );
  });

  it("warms the route once when the observed link becomes visible", async () => {
    let observerCallback: IntersectionObserverCallback | null = null;
    const disconnect = vi.fn<() => void>();
    const observe = vi.fn<(target: Element) => void>();

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "160px 0px";
      readonly scrollMargin = "0px";
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      disconnect = disconnect;
      observe = observe;
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve(_target: Element): void {}
    }

    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: MockIntersectionObserver,
    });

    await act(async () => {
      root.render(<Harness slug="svgo-plugin-hoist-stroke-width" />);
      await flush();
    });

    const playgroundLink = container.querySelector<HTMLAnchorElement>(
      'a[href="./svgo-plugin-hoist-stroke-width/"]',
    );

    if (playgroundLink === null || observerCallback === null) {
      throw new Error("Expected observed landing link");
    }

    expect(observe).toHaveBeenCalledWith(playgroundLink);

    const triggerObserver: IntersectionObserverCallback = observerCallback;

    await act(async () => {
      triggerObserver(
        [
          {
            boundingClientRect: playgroundLink.getBoundingClientRect(),
            intersectionRatio: 0,
            intersectionRect: playgroundLink.getBoundingClientRect(),
            isIntersecting: false,
            rootBounds: null,
            target: playgroundLink,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      );
      triggerObserver(
        [
          {
            boundingClientRect: playgroundLink.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: playgroundLink.getBoundingClientRect(),
            isIntersecting: true,
            rootBounds: null,
            target: playgroundLink,
            time: 1,
          },
        ],
        {} as IntersectionObserver,
      );
      triggerObserver(
        [
          {
            boundingClientRect: playgroundLink.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: playgroundLink.getBoundingClientRect(),
            isIntersecting: true,
            rootBounds: null,
            target: playgroundLink,
            time: 2,
          },
        ],
        {} as IntersectionObserver,
      );
      await flush();
    });

    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledTimes(1);
    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledWith(
      "svgo-plugin-hoist-stroke-width",
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
