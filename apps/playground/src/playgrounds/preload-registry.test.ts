import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("preload-registry", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    vi.resetModules();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/apps/playground/");
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./svgo-plugin-hoist-stroke-width/App");
  });

  it("adds warmup links for the playground route without duplication", async () => {
    const { warmPlaygroundRoutes } = await import("./preload-registry");

    await warmPlaygroundRoutes([
      "svgo-plugin-hoist-stroke-width",
      "svgo-plugin-hoist-stroke-width",
    ]);

    expect(
      document.head.querySelector(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"][data-warmup-kind="document"]',
      ),
    ).not.toBeNull();
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"][data-warmup-kind="style"]',
      ),
    ).not.toBeNull();
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"][data-warmup-kind="module-0"]',
      ),
    ).not.toBeNull();
    expect(
      document.head.querySelectorAll(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"]',
      ),
    ).toHaveLength(3);

    await warmPlaygroundRoutes(["svgo-plugin-hoist-stroke-width"]);

    expect(
      document.head.querySelectorAll(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"]',
      ),
    ).toHaveLength(3);
  });

  it("falls back to a document prefetch when no warmup definition exists", async () => {
    const { warmPlaygroundRoute } = await import("./preload-registry");

    await warmPlaygroundRoute("missing-playground");

    expect(
      document.head.querySelector(
        'link[data-playground-warmup="missing-playground"][data-warmup-kind="document"]',
      ),
    ).not.toBeNull();
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="missing-playground"][data-warmup-kind="style"]',
      ),
    ).toBeNull();
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="missing-playground"][data-warmup-kind="module-0"]',
      ),
    ).toBeNull();
  });

  it("warms route assets without importing the playground app module", async () => {
    vi.doMock("./svgo-plugin-hoist-stroke-width/App", () => {
      throw new Error("App module should not be imported during warmup");
    });

    const { warmPlaygroundRoute } = await import("./preload-registry");

    await expect(
      warmPlaygroundRoute("svgo-plugin-hoist-stroke-width"),
    ).resolves.toBeUndefined();

    expect(
      document.head.querySelector(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"][data-warmup-kind="document"]',
      ),
    ).not.toBeNull();
  });

  it("schedules warmup through requestIdleCallback when available", async () => {
    const requestIdleCallback = vi.fn<
      (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    >((callback: IdleRequestCallback, options?: IdleRequestOptions) => {
      callback({
        didTimeout: false,
        timeRemaining: () => {
          return 0;
        },
      });
      return (options?.timeout ?? 0) as number;
    });

    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: requestIdleCallback,
    });

    const { schedulePlaygroundWarmup } = await import("./preload-registry");

    schedulePlaygroundWarmup();
    await flush();

    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(requestIdleCallback.mock.calls[0]?.[1]).toEqual({
      timeout: 250,
    });
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="svgo-plugin-hoist-stroke-width"][data-warmup-kind="document"]',
      ),
    ).not.toBeNull();
  });

  it("falls back to setTimeout when requestIdleCallback is unavailable", async () => {
    const setTimeoutSpy = vi
      .spyOn(window, "setTimeout")
      .mockImplementation(
        (handler: TimerHandler): ReturnType<typeof window.setTimeout> => {
          if (typeof handler === "function") {
            handler();
          }

          return 0 as unknown as ReturnType<typeof window.setTimeout>;
        },
      );

    const { schedulePlaygroundWarmup } = await import("./preload-registry");

    schedulePlaygroundWarmup(["missing-playground"]);
    await flush();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);
    expect(
      document.head.querySelector(
        'link[data-playground-warmup="missing-playground"][data-warmup-kind="document"]',
      ),
    ).not.toBeNull();
  });
});
