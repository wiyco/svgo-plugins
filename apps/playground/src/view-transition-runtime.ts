type WindowWithViewTransitionFilter = Window &
  typeof globalThis & {
    __playgroundViewTransitionFilterInstalled?: boolean;
  };

type ViewTransitionLike = {
  finished?: Promise<unknown>;
  ready?: Promise<unknown>;
  updateCallbackDone?: Promise<unknown>;
};

type ViewTransitionEventLike = Event & {
  viewTransition?: ViewTransitionLike | null;
};

const SKIPPED_VIEW_TRANSITION_MESSAGE = "Transition was skipped";

export const isSkippedViewTransitionError = (value: unknown): boolean => {
  if (!(value instanceof Error)) {
    return false;
  }

  return (
    value.name === "AbortError" &&
    value.message === SKIPPED_VIEW_TRANSITION_MESSAGE
  );
};

const silenceViewTransitionPromises = (
  viewTransition: ViewTransitionLike | null | undefined,
): void => {
  void viewTransition?.ready?.catch(() => undefined);
  void viewTransition?.finished?.catch(() => undefined);
  void viewTransition?.updateCallbackDone?.catch(() => undefined);
};

const handleViewTransitionLifecycle = (event: Event): void => {
  silenceViewTransitionPromises(
    (event as ViewTransitionEventLike).viewTransition,
  );
};

const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
  if (!isSkippedViewTransitionError(event.reason)) {
    return;
  }

  event.preventDefault();
};

export const installViewTransitionErrorFilter = (): void => {
  const windowWithFilter = window as WindowWithViewTransitionFilter;

  if (windowWithFilter.__playgroundViewTransitionFilterInstalled === true) {
    return;
  }

  windowWithFilter.__playgroundViewTransitionFilterInstalled = true;

  window.addEventListener("pageswap", handleViewTransitionLifecycle);
  window.addEventListener("pagereveal", handleViewTransitionLifecycle);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
};
