import { useCallback } from "react";

import { useLinkWarmup } from "../core/link-warmup";
import { warmPlaygroundRoute } from "../playgrounds/preload-registry";

const warmPlayground = (slug: string): void => {
  void warmPlaygroundRoute(slug);
};

export const usePlaygroundLinkWarmup = (slug: string) => {
  const handleWarmup = useCallback(() => {
    warmPlayground(slug);
  }, [slug]);

  return useLinkWarmup(handleWarmup, {
    warmupKey: slug,
  });
};
