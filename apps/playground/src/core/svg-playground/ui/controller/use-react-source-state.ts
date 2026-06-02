import { startTransition, useEffect, useState } from "react";

import type {
  ReactSourceState,
  TransformState,
} from "./svg-playground-controller-types";

import { createReactSource } from "../../source/create-react-source";
import { getErrorMessage } from "../../utils/get-error-message";

type ReactSourceBuildState = {
  error: string;
  optimizedSvg: string;
  source: string;
};

type ScheduledReactSourceBuild =
  | { kind: "idle"; id: number }
  | { kind: "timeout"; id: ReturnType<typeof window.setTimeout> };

const EMPTY_REACT_SOURCE_STATE = {
  error: "",
  isPending: false,
  source: "",
} satisfies ReactSourceState;

const LOADING_REACT_SOURCE_STATE = {
  error: "",
  isPending: true,
  source: "",
} satisfies ReactSourceState;

const EMPTY_REACT_SOURCE_BUILD_STATE = {
  error: "",
  optimizedSvg: "",
  source: "",
} satisfies ReactSourceBuildState;

const REACT_SOURCE_BUILD_TIMEOUT_MS = 150;

const createBuiltReactSourceState = (
  optimizedSvg: string,
): ReactSourceBuildState => {
  try {
    return {
      error: "",
      optimizedSvg,
      source: createReactSource(optimizedSvg),
    };
  } catch (error) {
    return {
      error: getErrorMessage(error, "Unable to generate React source."),
      optimizedSvg,
      source: "",
    };
  }
};

const scheduleReactSourceBuild = (
  callback: () => void,
): ScheduledReactSourceBuild => {
  if (typeof window.requestIdleCallback === "function") {
    return {
      kind: "idle",
      id: window.requestIdleCallback(callback, {
        timeout: REACT_SOURCE_BUILD_TIMEOUT_MS,
      }),
    };
  }

  return {
    kind: "timeout",
    id: window.setTimeout(callback, 0),
  };
};

const cancelReactSourceBuild = (
  scheduledBuild: ScheduledReactSourceBuild,
): void => {
  if (scheduledBuild.kind === "idle") {
    window.cancelIdleCallback?.(scheduledBuild.id);
    return;
  }

  window.clearTimeout(scheduledBuild.id);
};

const getRequestedOptimizedSvg = (transformState: TransformState): string => {
  return transformState.kind === "success" ? transformState.optimizedSvg : "";
};

const toReactSourceState = (
  buildState: ReactSourceBuildState,
  requestedOptimizedSvg: string,
): ReactSourceState => {
  if (requestedOptimizedSvg.length === 0) {
    return EMPTY_REACT_SOURCE_STATE;
  }

  if (buildState.optimizedSvg !== requestedOptimizedSvg) {
    return LOADING_REACT_SOURCE_STATE;
  }

  return {
    error: buildState.error,
    isPending: false,
    source: buildState.source,
  };
};

export const useReactSourceState = (
  transformState: TransformState,
): ReactSourceState => {
  const requestedOptimizedSvg = getRequestedOptimizedSvg(transformState);
  const [buildState, setBuildState] = useState<ReactSourceBuildState>(
    EMPTY_REACT_SOURCE_BUILD_STATE,
  );

  useEffect(() => {
    if (requestedOptimizedSvg.length === 0) {
      setBuildState(EMPTY_REACT_SOURCE_BUILD_STATE);
      return;
    }

    let isStale = false;
    const scheduledBuild = scheduleReactSourceBuild(() => {
      const nextState = createBuiltReactSourceState(requestedOptimizedSvg);

      startTransition(() => {
        if (!isStale) {
          setBuildState(nextState);
        }
      });
    });

    return () => {
      isStale = true;
      cancelReactSourceBuild(scheduledBuild);
    };
  }, [requestedOptimizedSvg]);

  return toReactSourceState(buildState, requestedOptimizedSvg);
};
