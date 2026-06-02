import { beforeEach, describe, expect, it, vi } from "vitest";

describe("view-transition-runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (
      window as Window &
        typeof globalThis & {
          __playgroundViewTransitionFilterInstalled?: boolean;
        }
    ).__playgroundViewTransitionFilterInstalled;
  });

  it("recognizes the skipped view-transition abort error", async () => {
    const { isSkippedViewTransitionError } =
      await import("./view-transition-runtime");

    expect(isSkippedViewTransitionError("Transition was skipped")).toBe(false);
    expect(
      isSkippedViewTransitionError(
        new DOMException("Transition was skipped", "AbortError"),
      ),
    ).toBe(true);
    expect(
      isSkippedViewTransitionError(
        new DOMException("Another abort reason", "AbortError"),
      ),
    ).toBe(false);
    expect(
      isSkippedViewTransitionError(new Error("Transition was skipped")),
    ).toBe(false);
  });

  it("suppresses the skipped-transition promise rejection only once", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const { installViewTransitionErrorFilter } =
      await import("./view-transition-runtime");

    installViewTransitionErrorFilter();
    installViewTransitionErrorFilter();

    const unhandledRejectionRegistrations =
      addEventListenerSpy.mock.calls.filter(([type]) => {
        return type === "unhandledrejection";
      });

    expect(unhandledRejectionRegistrations).toHaveLength(1);

    const event = new Event("unhandledrejection", {
      cancelable: true,
    }) as PromiseRejectionEvent;

    Object.defineProperty(event, "reason", {
      configurable: true,
      value: new DOMException("Transition was skipped", "AbortError"),
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores unrelated rejections and drains view-transition lifecycle promises", async () => {
    const { installViewTransitionErrorFilter } =
      await import("./view-transition-runtime");

    installViewTransitionErrorFilter();

    const pageswapEvent = new Event("pageswap") as Event & {
      viewTransition?: {
        finished?: Promise<unknown>;
        ready?: Promise<unknown>;
        updateCallbackDone?: Promise<unknown>;
      };
    };

    pageswapEvent.viewTransition = {
      finished: Promise.reject(
        new DOMException("Transition was skipped", "AbortError"),
      ),
      ready: Promise.reject(
        new DOMException("Transition was skipped", "AbortError"),
      ),
      updateCallbackDone: Promise.reject(
        new DOMException("Transition was skipped", "AbortError"),
      ),
    };

    window.dispatchEvent(pageswapEvent);

    const unrelatedEvent = new Event("unhandledrejection", {
      cancelable: true,
    }) as PromiseRejectionEvent;

    Object.defineProperty(unrelatedEvent, "reason", {
      configurable: true,
      value: new Error("different failure"),
    });

    window.dispatchEvent(unrelatedEvent);

    expect(unrelatedEvent.defaultPrevented).toBe(false);

    await Promise.resolve();
    await Promise.resolve();

    const pagerevealEvent = new Event("pagereveal") as Event & {
      viewTransition?: {
        finished?: Promise<unknown>;
        ready?: Promise<unknown>;
        updateCallbackDone?: Promise<unknown>;
      } | null;
    };

    pagerevealEvent.viewTransition = null;

    window.dispatchEvent(pagerevealEvent);
  });
});
