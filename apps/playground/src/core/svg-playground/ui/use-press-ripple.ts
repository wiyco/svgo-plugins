import type {
  ButtonHTMLAttributes,
  FocusEventHandler,
  KeyboardEventHandler,
  PointerEventHandler,
} from "react";

import { useCallback, useEffect, useMemo, useRef } from "react";

const RIPPLE_DURATION_MS = 420;
const TOUCH_RIPPLE_DIAMETER_MIN_PX = 64;
const TOUCH_RIPPLE_DIAMETER_MAX_PX = 112;
const TOUCH_RIPPLE_SIZE_MULTIPLIER = 1.8;

export type RippleHandlers = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onBlur" | "onKeyDown" | "onPointerDown"
>;

const centerRipple = (element: HTMLButtonElement) => {
  return {
    x: element.clientWidth / 2,
    y: element.clientHeight / 2,
  };
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getTouchRippleDiameter = (element: HTMLButtonElement) => {
  return clamp(
    Math.ceil(
      Math.min(element.clientWidth, element.clientHeight) *
        TOUCH_RIPPLE_SIZE_MULTIPLIER,
    ),
    TOUCH_RIPPLE_DIAMETER_MIN_PX,
    TOUCH_RIPPLE_DIAMETER_MAX_PX,
  );
};

export const usePressRipple = (): RippleHandlers => {
  const timersRef = useRef(new Map<HTMLButtonElement, number>());

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timeoutId of timers.values()) {
        window.clearTimeout(timeoutId);
      }

      timers.clear();
    };
  }, []);

  const resetRipple = useCallback((element: HTMLButtonElement) => {
    const timeoutId = timersRef.current.get(element);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }

    timersRef.current.set(
      element,
      window.setTimeout(() => {
        element.dataset.rippleState = "idle";
        timersRef.current.delete(element);
      }, RIPPLE_DURATION_MS),
    );
  }, []);

  const triggerRipple = useCallback(
    (
      element: HTMLButtonElement,
      origin: { x: number; y: number },
      pointerType?: string,
    ) => {
      if (element.disabled) {
        return;
      }

      const rippleSize =
        pointerType === "touch"
          ? getTouchRippleDiameter(element)
          : Math.ceil(
              Math.hypot(
                Math.max(origin.x, element.clientWidth - origin.x),
                Math.max(origin.y, element.clientHeight - origin.y),
              ) * 2,
            );

      element.style.setProperty("--ripple-origin-x", `${origin.x}px`);
      element.style.setProperty("--ripple-origin-y", `${origin.y}px`);
      element.style.setProperty("--ripple-size", `${rippleSize}px`);
      element.dataset.rippleState = "idle";
      void element.offsetWidth;
      element.dataset.rippleState = "active";
      resetRipple(element);
    },
    [resetRipple],
  );

  const onPointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      const rect = event.currentTarget.getBoundingClientRect();

      triggerRipple(
        event.currentTarget,
        {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        event.pointerType,
      );
    },
    [triggerRipple],
  );

  const onKeyDown = useCallback<KeyboardEventHandler<HTMLButtonElement>>(
    (event) => {
      if (event.repeat || (event.key !== " " && event.key !== "Enter")) {
        return;
      }

      triggerRipple(event.currentTarget, centerRipple(event.currentTarget));
    },
    [triggerRipple],
  );

  const onBlur = useCallback<FocusEventHandler<HTMLButtonElement>>((event) => {
    event.currentTarget.dataset.rippleState = "idle";
  }, []);

  return useMemo(() => {
    return {
      onBlur,
      onKeyDown,
      onPointerDown,
    };
  }, [onBlur, onKeyDown, onPointerDown]);
};
