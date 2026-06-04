import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
} from "../../model";

import {
  createLocationHref,
  getLocationSearchSnapshot,
  replaceLocationSearch,
  subscribeToLocationSearch,
} from "./playground-url-store";

export const PLAYGROUND_URL_SYNC_DELAY_MS = 400;

type QueryStateUpdater = (
  value:
    | PlaygroundQueryState
    | ((currentState: PlaygroundQueryState) => PlaygroundQueryState),
) => void;

const areQueryStatesEqual = (
  left: PlaygroundQueryState,
  right: PlaygroundQueryState,
): boolean => {
  return (
    left.color === right.color &&
    left.size === right.size &&
    left.strokeWidth === right.strokeWidth &&
    left.svg === right.svg
  );
};

export const syncPlaygroundQueryStateToUrl = (
  definition: SvgPlaygroundDefinition,
  queryState: PlaygroundQueryState,
): string => {
  const search = definition.serializeState(queryState);

  replaceLocationSearch(search);

  return createLocationHref(search);
};

export const usePlaygroundQueryStateUrlSync = ({
  definition,
  enabled = true,
  queryState,
}: {
  definition: SvgPlaygroundDefinition;
  enabled?: boolean;
  queryState: PlaygroundQueryState;
}): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      syncPlaygroundQueryStateToUrl(definition, queryState);
    }, PLAYGROUND_URL_SYNC_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [definition, enabled, queryState]);
};

export const usePlaygroundQueryState = (
  definition: SvgPlaygroundDefinition,
): readonly [PlaygroundQueryState, QueryStateUpdater] => {
  const search = useSyncExternalStore(
    subscribeToLocationSearch,
    getLocationSearchSnapshot,
  );
  const queryState = useMemo(() => {
    return definition.parseState(search);
  }, [definition, search]);
  const [localQueryState, setLocalQueryState] = useState(queryState);
  const lastSearchRef = useRef(search);

  useEffect(() => {
    if (lastSearchRef.current === search) {
      return;
    }

    lastSearchRef.current = search;
    setLocalQueryState((currentState) => {
      return areQueryStatesEqual(currentState, queryState)
        ? currentState
        : queryState;
    });
  }, [queryState, search]);

  const setQueryState = useCallback<QueryStateUpdater>((nextValue) => {
    setLocalQueryState((currentState) => {
      return typeof nextValue === "function"
        ? nextValue(currentState)
        : nextValue;
    });
  }, []);

  return [localQueryState, setQueryState] as const;
};
