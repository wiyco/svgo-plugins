import { useEffect, useState } from "react";

import type { TransformFn } from "../model";
import { createTransformWorkerClient } from "./svg-transform-worker-client";

export const useWorkerTransform = (workerUrl: URL): TransformFn | null => {
  const [transform, setTransform] = useState<TransformFn | null>(null);

  useEffect(() => {
    const client = createTransformWorkerClient(workerUrl);

    setTransform(() => {
      return client.transform;
    });

    return () => {
      client.dispose();
    };
  }, [workerUrl]);

  return transform;
};
