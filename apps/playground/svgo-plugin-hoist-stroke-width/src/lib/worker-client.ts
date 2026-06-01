import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
  WorkerTransformClient,
} from "./types";

type PendingRequest = {
  reject: (reason?: unknown) => void;
  resolve: (value: WorkerResponseMessage["payload"]) => void;
};

export const createTransformWorkerClient = (): WorkerTransformClient => {
  const worker = new Worker(
    new URL("../transform.worker.ts", import.meta.url),
    {
      type: "module",
    },
  );
  let nextRequestId = 0;
  const pendingRequests = new Map<number, PendingRequest>();

  const rejectPendingRequests = (reason: string): void => {
    for (const request of pendingRequests.values()) {
      request.reject(new Error(reason));
    }

    pendingRequests.clear();
  };

  worker.addEventListener(
    "message",
    (event: MessageEvent<WorkerResponseMessage>) => {
      const pendingRequest = pendingRequests.get(event.data.id);

      if (pendingRequest === undefined) {
        return;
      }

      pendingRequests.delete(event.data.id);
      pendingRequest.resolve(event.data.payload);
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

        worker.postMessage({
          id: requestId,
          payload,
        } satisfies WorkerRequestMessage);
      });
    },
  };
};
