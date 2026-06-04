/// <reference lib="webworker" />

import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
} from "../../core/svg-playground/model";

import { getErrorMessage } from "../../core/svg-playground/utils/get-error-message";
import { transformSvgRequest } from "./transform-svg-request";

const workerScope = self as DedicatedWorkerGlobalScope;

const handleRequest = async ({
  id,
  payload,
}: WorkerRequestMessage): Promise<void> => {
  try {
    const response = await transformSvgRequest(payload);

    workerScope.postMessage({
      id,
      payload: response,
    } satisfies WorkerResponseMessage);
  } catch (error) {
    workerScope.postMessage({
      id,
      payload: {
        kind: "error",
        message: getErrorMessage(error, "Unexpected transform failure."),
      },
    } satisfies WorkerResponseMessage);
  }
};

workerScope.addEventListener(
  "message",
  (event: MessageEvent<WorkerRequestMessage>) => {
    void handleRequest(event.data);
  },
);

export {};
