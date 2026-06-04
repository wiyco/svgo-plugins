import { type RefObject, useCallback, useEffect, useRef } from "react";

type LinkWarmupOptions = {
  rootMargin?: string;
  warmupKey: string;
};

type LinkWarmupResult = {
  handleWarmup: () => void;
  linkRef: RefObject<HTMLAnchorElement | null>;
};

const DEFAULT_ROOT_MARGIN = "160px 0px";

export const useLinkWarmup = (
  warmup: () => void,
  options: LinkWarmupOptions,
): LinkWarmupResult => {
  const { rootMargin = DEFAULT_ROOT_MARGIN, warmupKey } = options;
  const didWarmRef = useRef(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const warmupKeyRef = useRef(warmupKey);

  if (warmupKeyRef.current !== warmupKey) {
    warmupKeyRef.current = warmupKey;
    didWarmRef.current = false;
  }

  const handleWarmup = useCallback(() => {
    if (didWarmRef.current) {
      return;
    }

    didWarmRef.current = true;
    warmup();
  }, [warmup]);

  useEffect(() => {
    const link = linkRef.current;

    if (link === null || typeof IntersectionObserver !== "function") {
      return;
    }

    let didObserveWarm = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (didObserveWarm) {
          return;
        }

        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting !== true) {
          return;
        }

        didObserveWarm = true;
        handleWarmup();
        observer.disconnect();
      },
      {
        rootMargin,
      },
    );

    observer.observe(link);

    return () => {
      observer.disconnect();
    };
  }, [handleWarmup, rootMargin]);

  return {
    handleWarmup,
    linkRef,
  };
};
