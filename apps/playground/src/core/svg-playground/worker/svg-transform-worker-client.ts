import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
  WorkerTransformClient,
} from "../model";

type PendingRequest = {
  reject: (reason?: unknown) => void;
  resolve: (value: WorkerResponseMessage["payload"]) => void;
};

type QueuedRequest = {
  id: number;
  payload: WorkerRequestMessage["payload"];
};

const SUPERSEDED_REQUEST_REASON =
  "Transform request superseded by newer input.";

export const createTransformWorkerClient = (
  workerUrl: URL,
): WorkerTransformClient => {
  const worker = new Worker(workerUrl, { type: "module" });
  let nextRequestId = 0;
  let activeRequestId: number | null = null;
  let queuedRequest: QueuedRequest | null = null;
  const pendingRequests = new Map<number, PendingRequest>();

  const rejectPendingRequests = (reason: string): void => {
    for (const request of pendingRequests.values()) {
      request.reject(new Error(reason));
    }

    activeRequestId = null;
    queuedRequest = null;
    pendingRequests.clear();
  };

  const postRequest = (request: QueuedRequest): void => {
    activeRequestId = request.id;
    worker.postMessage({
      id: request.id,
      payload: request.payload,
    } satisfies WorkerRequestMessage);
  };

  const flushQueuedRequest = (): void => {
    if (activeRequestId !== null || queuedRequest === null) {
      return;
    }

    const nextRequest = queuedRequest;

    queuedRequest = null;
    postRequest(nextRequest);
  };

  const rejectQueuedRequest = (): void => {
    if (queuedRequest === null) {
      return;
    }

    const pendingRequest = pendingRequests.get(queuedRequest.id);

    if (pendingRequest !== undefined) {
      pendingRequests.delete(queuedRequest.id);
      pendingRequest.reject(new Error(SUPERSEDED_REQUEST_REASON));
    }

    queuedRequest = null;
  };

  worker.addEventListener(
    "message",
    (event: MessageEvent<WorkerResponseMessage>) => {
      const pendingRequest = pendingRequests.get(event.data.id);

      if (pendingRequest === undefined) {
        return;
      }

      pendingRequests.delete(event.data.id);
      if (activeRequestId === event.data.id) {
        activeRequestId = null;
      }
      pendingRequest.resolve(event.data.payload);
      flushQueuedRequest();
    },
  );

  worker.addEventListener("error", (event) => {
    rejectPendingRequests(event.message || "Transform worker crashed.");
  });

  return {
    dispose: () => {
      rejectPendingRequests("Transform worker stopped.");
      worker.terminate();
    },
    transform: (payload) => {
      return new Promise((resolve, reject) => {
        const requestId = nextRequestId;

        nextRequestId += 1;
        pendingRequests.set(requestId, {
          reject,
          resolve,
        });

        if (activeRequestId === null) {
          postRequest({
            id: requestId,
            payload,
          });
          return;
        }

        rejectQueuedRequest();
        queuedRequest = {
          id: requestId,
          payload,
        };
      });
    },
  };
};
