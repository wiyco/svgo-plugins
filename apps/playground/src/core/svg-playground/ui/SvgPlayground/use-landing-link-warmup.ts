import { useCallback } from "react";

import { warmLandingRoute } from "../../../../playgrounds/preload-registry";
import { useLinkWarmup } from "../../../link-warmup";

export const useLandingLinkWarmup = () => {
  const handleWarmup = useCallback(() => {
    void warmLandingRoute();
  }, []);

  return useLinkWarmup(handleWarmup, {
    warmupKey: "landing",
  });
};
