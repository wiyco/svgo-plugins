import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLinkWarmup } from "./link-warmup";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

type HarnessState = ReturnType<typeof useLinkWarmup>;

const Harness = (props: {
  rootMargin?: string;
  warmup: () => void;
  warmupKey: string;
}) => {
  latestHarnessState = useLinkWarmup(
    props.warmup,
    props.rootMargin === undefined
      ? {
          warmupKey: props.warmupKey,
        }
      : {
          rootMargin: props.rootMargin,
          warmupKey: props.warmupKey,
        },
  );

  return (
    <a ref={latestHarnessState.linkRef} href="./target/">
      Open target
    </a>
  );
};

let container: HTMLDivElement;
let root: Root;
let latestHarnessState: HarnessState | null = null;

beforeEach(() => {
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

describe("useLinkWarmup", () => {
  it("warms once when the returned handler is invoked repeatedly", async () => {
    const warmup = vi.fn<() => void>();

    await act(async () => {
      root.render(<Harness warmup={warmup} warmupKey="target" />);
      await flush();
    });

    if (latestHarnessState === null) {
      throw new Error("Expected warmup hook state");
    }

    const harnessState = latestHarnessState;

    await act(async () => {
      harnessState.handleWarmup();
      harnessState.handleWarmup();
      await flush();
    });

    expect(warmup).toHaveBeenCalledTimes(1);
  });

  it("warms once when the observed link becomes visible", async () => {
    const warmup = vi.fn<() => void>();
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
      root.render(<Harness warmup={warmup} warmupKey="target" />);
      await flush();
    });

    const link = container.querySelector<HTMLAnchorElement>(
      'a[href="./target/"]',
    );

    if (link === null || observerCallback === null) {
      throw new Error("Expected observed link");
    }

    expect(observe).toHaveBeenCalledWith(link);

    const triggerObserver: IntersectionObserverCallback = observerCallback;

    await act(async () => {
      triggerObserver(
        [
          {
            boundingClientRect: link.getBoundingClientRect(),
            intersectionRatio: 0,
            intersectionRect: link.getBoundingClientRect(),
            isIntersecting: false,
            rootBounds: null,
            target: link,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      );
      triggerObserver(
        [
          {
            boundingClientRect: link.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: link.getBoundingClientRect(),
            isIntersecting: true,
            rootBounds: null,
            target: link,
            time: 1,
          },
        ],
        {} as IntersectionObserver,
      );
      triggerObserver(
        [
          {
            boundingClientRect: link.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: link.getBoundingClientRect(),
            isIntersecting: true,
            rootBounds: null,
            target: link,
            time: 2,
          },
        ],
        {} as IntersectionObserver,
      );
      await flush();
    });

    expect(warmup).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("resets the one-shot guard when the warmup key changes", async () => {
    const warmup = vi.fn<() => void>();

    await act(async () => {
      root.render(<Harness warmup={warmup} warmupKey="first" />);
      await flush();
    });

    if (latestHarnessState === null) {
      throw new Error("Expected warmup hook state");
    }

    latestHarnessState.handleWarmup();

    await act(async () => {
      root.render(<Harness warmup={warmup} warmupKey="second" />);
      await flush();
    });

    if (latestHarnessState === null) {
      throw new Error("Expected warmup hook state after key change");
    }

    latestHarnessState.handleWarmup();

    expect(warmup).toHaveBeenCalledTimes(2);
  });
});
