import { useEffect, useState } from "react";

import type { TransformFn } from "./types";
import { createTransformWorkerClient } from "./worker-client";

export const useWorkerTransform = (): TransformFn | null => {
  const [transform, setTransform] = useState<TransformFn | null>(null);

  useEffect(() => {
    const client = createTransformWorkerClient();

    setTransform(() => {
      return client.transform;
    });

    return () => {
      client.dispose();
    };
  }, []);

  return transform;
};
