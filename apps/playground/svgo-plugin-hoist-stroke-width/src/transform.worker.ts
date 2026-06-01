/// <reference lib="webworker" />

import { transformSvgRequest } from "./lib/transform-pipeline";
import type { WorkerRequestMessage, WorkerResponseMessage } from "./lib/types";

const workerScope = self as DedicatedWorkerGlobalScope;

const handleRequest = async ({
  id,
  payload,
}: WorkerRequestMessage): Promise<void> => {
  const response = await transformSvgRequest(payload);

  workerScope.postMessage({
    id,
    payload: response,
  } satisfies WorkerResponseMessage);
};

workerScope.addEventListener(
  "message",
  (event: MessageEvent<WorkerRequestMessage>) => {
    void handleRequest(event.data);
  },
);

export {};
