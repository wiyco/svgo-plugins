import { useCallback, useMemo, useSyncExternalStore } from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
} from "../../model";

import {
  getLocationSearchSnapshot,
  replaceLocationSearch,
  subscribeToLocationSearch,
} from "./playground-url-store";

type QueryStateUpdater = (
  value:
    | PlaygroundQueryState
    | ((currentState: PlaygroundQueryState) => PlaygroundQueryState),
) => void;

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

  const setQueryState = useCallback<QueryStateUpdater>(
    (nextValue) => {
      const currentState = definition.parseState(getLocationSearchSnapshot());
      const nextState =
        typeof nextValue === "function" ? nextValue(currentState) : nextValue;

      replaceLocationSearch(definition.serializeState(nextState));
    },
    [definition],
  );

  return [queryState, setQueryState] as const;
};
