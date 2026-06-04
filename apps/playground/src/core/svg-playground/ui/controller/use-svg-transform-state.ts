import { useDeferredValue, useEffect, useState } from "react";

import type { TransformFn } from "../../model";
import type { TransformState } from "./svg-playground-controller-types";

const IDLE_TRANSFORM_STATE = {
  kind: "idle",
} satisfies TransformState;

export const REBUILDING_FALLBACK_DELAY_MS = 200;

export const useSvgTransformState = (
  svg: string,
  transform: TransformFn,
): TransformState => {
  const deferredSvg = useDeferredValue(svg);
  const [transformState, setTransformState] =
    useState<TransformState>(IDLE_TRANSFORM_STATE);

  useEffect(() => {
    const nextSvg = deferredSvg.trim();

    if (nextSvg.length === 0) {
      setTransformState(IDLE_TRANSFORM_STATE);
      return;
    }

    let isStale = false;
    const loadingTimeoutId = window.setTimeout(() => {
      setTransformState({
        kind: "loading",
      });
    }, REBUILDING_FALLBACK_DELAY_MS);

    setTransformState((currentState) => {
      return currentState.kind === "success" || currentState.kind === "loading"
        ? currentState
        : IDLE_TRANSFORM_STATE;
    });

    void (async () => {
      try {
        const result = await transform({
          svg: nextSvg,
        });

        if (isStale) {
          return;
        }

        window.clearTimeout(loadingTimeoutId);

        if (result.kind === "success") {
          setTransformState({
            kind: "success",
            optimizedSvg: result.optimizedSvg,
          });
          return;
        }

        setTransformState({
          kind: result.kind,
          message: result.kind === "unsafe" ? result.reason : result.message,
        });
      } catch (error) {
        if (isStale) {
          return;
        }

        window.clearTimeout(loadingTimeoutId);
        setTransformState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unexpected preview failure.",
        });
      }
    })();

    return () => {
      isStale = true;
      window.clearTimeout(loadingTimeoutId);
    };
  }, [deferredSvg, transform]);

  return transformState;
};
