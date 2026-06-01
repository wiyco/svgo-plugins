import { useDeferredValue, useEffect, useState } from "react";

import type { TransformFn } from "../../model";
import type { TransformState } from "./svg-playground-controller-types";

const IDLE_TRANSFORM_STATE = {
  kind: "idle",
} satisfies TransformState;

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

    setTransformState({
      kind: "loading",
    });

    void (async () => {
      try {
        const result = await transform({
          svg: nextSvg,
        });

        if (isStale) {
          return;
        }

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
    };
  }, [deferredSvg, transform]);

  return transformState;
};
