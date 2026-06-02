import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePressRipple } from "./use-press-ripple";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

type RippleHarnessProps = {
  disabled?: boolean;
};

const RippleHarness = ({ disabled = false }: RippleHarnessProps) => {
  const rippleHandlers = usePressRipple();
  latestRippleHandlers = rippleHandlers;

  return (
    <button disabled={disabled} type="button" {...rippleHandlers}>
      Trigger ripple
    </button>
  );
};

const setButtonBox = (button: HTMLButtonElement) => {
  Object.defineProperty(button, "clientHeight", {
    configurable: true,
    value: 40,
  });
  Object.defineProperty(button, "clientWidth", {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(button, "offsetWidth", {
    configurable: true,
    value: 100,
  });
};

const dispatchPointerDown = (
  button: HTMLButtonElement,
  options: {
    clientX: number;
    clientY: number;
    pointerType?: string;
  },
) => {
  const event = new MouseEvent("pointerdown", {
    bubbles: true,
    clientX: options.clientX,
    clientY: options.clientY,
  });

  if (options.pointerType !== undefined) {
    Object.defineProperty(event, "pointerType", {
      configurable: true,
      value: options.pointerType,
    });
  }

  button.dispatchEvent(event);
};

let container: HTMLDivElement;
let root: Root;
let latestRippleHandlers: ReturnType<typeof usePressRipple> | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function mockRect() {
      return {
        bottom: 60,
        height: 40,
        left: 10,
        right: 110,
        toJSON: () => {
          return {};
        },
        top: 20,
        width: 100,
        x: 10,
        y: 20,
      } as DOMRect;
    },
  );

  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  latestRippleHandlers = null;
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
  vi.restoreAllMocks();
});

describe("use-press-ripple", () => {
  it("animates from the pointer origin, resets on blur, and restarts active timers", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    await act(async () => {
      root.render(<RippleHarness />);
      await flush();
    });

    const button = container.querySelector<HTMLButtonElement>("button");

    if (button === null) {
      throw new Error("Expected ripple button");
    }

    setButtonBox(button);

    await act(async () => {
      dispatchPointerDown(button, {
        clientX: 30,
        clientY: 40,
      });
      await flush();
    });

    expect(button.dataset.rippleState).toBe("active");
    expect(button.style.getPropertyValue("--ripple-origin-x")).toBe("20px");
    expect(button.style.getPropertyValue("--ripple-origin-y")).toBe("20px");
    expect(button.style.getPropertyValue("--ripple-size")).toBe("165px");

    await act(async () => {
      button.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await flush();
    });

    expect(button.dataset.rippleState).toBe("idle");

    await act(async () => {
      dispatchPointerDown(button, {
        clientX: 30,
        clientY: 40,
      });
      dispatchPointerDown(button, {
        clientX: 60,
        clientY: 30,
      });
      await flush();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(button.style.getPropertyValue("--ripple-origin-x")).toBe("50px");
    expect(button.style.getPropertyValue("--ripple-origin-y")).toBe("10px");

    await act(async () => {
      vi.advanceTimersByTime(420);
      await flush();
    });

    expect(button.dataset.rippleState).toBe("idle");
  });

  it("uses the centered origin for keyboard activation and ignores unsupported key presses", async () => {
    await act(async () => {
      root.render(<RippleHarness />);
      await flush();
    });

    const button = container.querySelector<HTMLButtonElement>("button");

    if (button === null) {
      throw new Error("Expected ripple button");
    }

    setButtonBox(button);

    await act(async () => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Enter",
          repeat: true,
        }),
      );
      await flush();
    });

    expect(button.dataset.rippleState).toBeUndefined();

    await act(async () => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Enter",
        }),
      );
      await flush();
    });

    expect(button.dataset.rippleState).toBe("active");
    expect(button.style.getPropertyValue("--ripple-origin-x")).toBe("50px");
    expect(button.style.getPropertyValue("--ripple-origin-y")).toBe("20px");
    expect(button.style.getPropertyValue("--ripple-size")).toBe("108px");
  });

  it("caps touch ripples so wide buttons do not flash like a full background fill", async () => {
    await act(async () => {
      root.render(<RippleHarness />);
      await flush();
    });

    const button = container.querySelector<HTMLButtonElement>("button");

    if (button === null) {
      throw new Error("Expected ripple button");
    }

    setButtonBox(button);

    await act(async () => {
      dispatchPointerDown(button, {
        clientX: 30,
        clientY: 40,
        pointerType: "touch",
      });
      await flush();
    });

    expect(button.dataset.rippleState).toBe("active");
    expect(button.style.getPropertyValue("--ripple-origin-x")).toBe("20px");
    expect(button.style.getPropertyValue("--ripple-origin-y")).toBe("20px");
    expect(button.style.getPropertyValue("--ripple-size")).toBe("72px");
  });

  it("does not trigger when the button is disabled", async () => {
    await act(async () => {
      root.render(<RippleHarness disabled />);
      await flush();
    });

    const button = container.querySelector<HTMLButtonElement>("button");

    if (button === null) {
      throw new Error("Expected ripple button");
    }

    setButtonBox(button);

    await act(async () => {
      dispatchPointerDown(button, {
        clientX: 30,
        clientY: 40,
      });
      await flush();
    });

    expect(button.dataset.rippleState).toBeUndefined();
    expect(button.style.getPropertyValue("--ripple-size")).toBe("");
  });

  it("keeps the ripple handlers stable across rerenders", async () => {
    await act(async () => {
      root.render(<RippleHarness />);
      await flush();
    });

    const previousRippleHandlers = latestRippleHandlers;

    await act(async () => {
      root.render(<RippleHarness />);
      await flush();
    });

    expect(latestRippleHandlers).not.toBeNull();
    expect(latestRippleHandlers).toBe(previousRippleHandlers);
    expect(latestRippleHandlers?.onBlur).toBe(previousRippleHandlers?.onBlur);
    expect(latestRippleHandlers?.onKeyDown).toBe(
      previousRippleHandlers?.onKeyDown,
    );
    expect(latestRippleHandlers?.onPointerDown).toBe(
      previousRippleHandlers?.onPointerDown,
    );
  });
});
