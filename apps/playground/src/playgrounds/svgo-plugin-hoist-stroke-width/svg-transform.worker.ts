/// <reference lib="webworker" />

import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
} from "../../core/svg-playground/model";

import { transformSvgRequest } from "./transform-svg-request";

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
