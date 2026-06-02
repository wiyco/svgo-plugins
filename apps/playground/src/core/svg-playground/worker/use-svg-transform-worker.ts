import { useEffect, useState } from "react";

import type { TransformFn, TransformWorkerFactory } from "../model";

import { createTransformWorkerClient } from "./svg-transform-worker-client";

export const useWorkerTransform = (
  createWorker: TransformWorkerFactory,
): TransformFn | null => {
  const [transform, setTransform] = useState<TransformFn | null>(null);

  useEffect(() => {
    const client = createTransformWorkerClient(createWorker);

    setTransform(() => {
      return client.transform;
    });

    return () => {
      client.dispose();
    };
  }, [createWorker]);

  return transform;
};
