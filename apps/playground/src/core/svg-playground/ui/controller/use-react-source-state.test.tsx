import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformState } from "./svg-playground-controller-types";

import {
  REACT_SOURCE_PENDING_DELAY_MS,
  useReactSourceState,
} from "./use-react-source-state";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

type HarnessProps = {
  transformState: TransformState;
};

const IDLE_TRANSFORM_STATE = {
  kind: "idle",
} satisfies TransformState;

const FIRST_SUCCESS_TRANSFORM_STATE = {
  kind: "success",
  optimizedSvg: '<svg data-source="first" />',
} satisfies TransformState;

const SECOND_SUCCESS_TRANSFORM_STATE = {
  kind: "success",
  optimizedSvg: '<svg data-source="second" />',
} satisfies TransformState;

const INVALID_SUCCESS_TRANSFORM_STATE = {
  kind: "success",
  optimizedSvg: "<g />",
} satisfies TransformState;

const ReactSourceStateHarness = ({ transformState }: HarnessProps) => {
  const reactSourceState = useReactSourceState(transformState);

  return (
    <div>
      <output data-testid="pending">
        {reactSourceState.isPending === true ? "yes" : "no"}
      </output>
      <output data-testid="error">{reactSourceState.error}</output>
      <output data-testid="source">{reactSourceState.source}</output>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  Object.defineProperty(window, "requestIdleCallback", {
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
  vi.useRealTimers();
});

describe("use-react-source-state", () => {
  it("stays empty when the transform has not produced safe optimized output", async () => {
    await act(async () => {
      root.render(
        <ReactSourceStateHarness transformState={IDLE_TRANSFORM_STATE} />,
      );
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe(
      "",
    );
    expect(container.querySelector('[data-testid="source"]')?.textContent).toBe(
      "",
    );
  });

  it("defers source generation and keeps only the latest optimized svg", async () => {
    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={FIRST_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(container.querySelector('[data-testid="source"]')?.textContent).toBe(
      "",
    );

    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={SECOND_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");

    await act(async () => {
      vi.runAllTimers();
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(
      container.querySelector('[data-testid="source"]')?.textContent,
    ).toContain('data-source="second"');
    expect(
      container.querySelector('[data-testid="source"]')?.textContent,
    ).not.toContain('data-source="first"');
  });

  it("shows pending only after the delay while keeping the previous successful source", async () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    const requestIdleCallback = vi.fn<
      (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    >((callback: IdleRequestCallback) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    });

    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: requestIdleCallback,
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      value: vi.fn<(id: number) => void>(),
    });

    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={FIRST_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    await act(async () => {
      idleCallbacks[0]?.({
        didTimeout: false,
        timeRemaining: () => {
          return 50;
        },
      });
      await flush();
    });

    expect(
      container.querySelector('[data-testid="source"]')?.textContent,
    ).toContain('data-source="first"');

    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={SECOND_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    await act(async () => {
      vi.advanceTimersByTime(REACT_SOURCE_PENDING_DELAY_MS - 1);
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(
      container.querySelector('[data-testid="source"]')?.textContent,
    ).toContain('data-source="first"');

    await act(async () => {
      vi.advanceTimersByTime(1);
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("yes");
    expect(container.querySelector('[data-testid="source"]')?.textContent).toBe(
      "",
    );

    await act(async () => {
      idleCallbacks[1]?.({
        didTimeout: false,
        timeRemaining: () => {
          return 50;
        },
      });
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(
      container.querySelector('[data-testid="source"]')?.textContent,
    ).toContain('data-source="second"');
  });

  it("reports React source generation errors after the deferred build runs", async () => {
    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={INVALID_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");

    await act(async () => {
      vi.runAllTimers();
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe(
      "Expected optimized SVG to contain a root <svg> element.",
    );
  });

  it("uses requestIdleCallback when available and cancels stale idle work", async () => {
    let idleCallback: IdleRequestCallback | null = null;
    const cancelIdleCallback = vi.fn<(id: number) => void>();
    const requestIdleCallback = vi.fn<
      (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    >((callback: IdleRequestCallback) => {
      idleCallback = callback;
      return 17;
    });

    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: requestIdleCallback,
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      value: cancelIdleCallback,
    });

    await act(async () => {
      root.render(
        <ReactSourceStateHarness
          transformState={FIRST_SUCCESS_TRANSFORM_STATE}
        />,
      );
      await flush();
    });

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 150,
    });
    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");

    await act(async () => {
      vi.advanceTimersByTime(REACT_SOURCE_PENDING_DELAY_MS);
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("yes");

    await act(async () => {
      root.render(
        <ReactSourceStateHarness transformState={IDLE_TRANSFORM_STATE} />,
      );
      await flush();
    });

    expect(cancelIdleCallback).toHaveBeenCalledWith(17);

    await act(async () => {
      idleCallback?.({
        didTimeout: false,
        timeRemaining: () => {
          return 0;
        },
      });
      await flush();
    });

    expect(
      container.querySelector('[data-testid="pending"]')?.textContent,
    ).toBe("no");
    expect(container.querySelector('[data-testid="source"]')?.textContent).toBe(
      "",
    );
  });
});
