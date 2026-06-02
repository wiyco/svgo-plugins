import { type RefObject, useCallback, useEffect, useRef } from "react";

import { warmPlaygroundRoute } from "../playgrounds/preload-registry";

type PlaygroundLinkWarmupResult = {
  handleWarmup: () => void;
  linkRef: RefObject<HTMLAnchorElement | null>;
};

const warmPlayground = (slug: string): void => {
  void warmPlaygroundRoute(slug);
};

export const usePlaygroundLinkWarmup = (
  slug: string,
): PlaygroundLinkWarmupResult => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const handleWarmup = useCallback(() => {
    warmPlayground(slug);
  }, [slug]);

  useEffect(() => {
    const link = linkRef.current;

    if (link === null || typeof IntersectionObserver !== "function") {
      return;
    }

    let didWarm = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (didWarm) {
          return;
        }

        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting !== true) {
          return;
        }

        didWarm = true;
        handleWarmup();
        observer.disconnect();
      },
      {
        rootMargin: "160px 0px",
      },
    );

    observer.observe(link);

    return () => {
      observer.disconnect();
    };
  }, [handleWarmup]);

  return {
    handleWarmup,
    linkRef,
  };
};
