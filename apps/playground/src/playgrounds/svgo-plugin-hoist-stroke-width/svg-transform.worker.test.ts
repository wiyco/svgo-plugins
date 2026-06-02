import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransformFn,
  WorkerRequestMessage,
} from "../../core/svg-playground/model";

const transformSvgRequest = vi.fn<TransformFn>();

vi.mock("./transform-svg-request", () => {
  return {
    transformSvgRequest,
  };
});

type MockWorkerScope = {
  addEventListener: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
};

let workerScope: MockWorkerScope;
let messageHandler:
  | ((event: MessageEvent<WorkerRequestMessage>) => void)
  | null = null;

beforeEach(() => {
  vi.resetModules();
  transformSvgRequest.mockReset();
  messageHandler = null;
  workerScope = {
    addEventListener: vi.fn<
      (
        type: string,
        handler: (event: MessageEvent<WorkerRequestMessage>) => void,
      ) => void
    >((type, handler) => {
      if (type === "message") {
        messageHandler = handler;
      }
    }),
    postMessage: vi.fn<(message: unknown) => void>(),
  };
  (globalThis as { self?: unknown }).self =
    workerScope as unknown as DedicatedWorkerGlobalScope;
});

afterEach(() => {
  delete (globalThis as { self?: unknown }).self;
});

describe("svg-transform.worker", () => {
  it("listens for requests and posts transformed responses", async () => {
    const response = {
      kind: "success" as const,
      optimizedSvg: "<svg data-optimized />",
    };

    transformSvgRequest.mockResolvedValue(response);

    await import("./svg-transform.worker");

    expect(workerScope.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );

    messageHandler?.({
      data: {
        id: 7,
        payload: {
          svg: "<svg />",
        },
      },
    } as MessageEvent<WorkerRequestMessage>);
    await Promise.resolve();
    await Promise.resolve();

    expect(transformSvgRequest).toHaveBeenCalledWith({
      svg: "<svg />",
    });
    expect(workerScope.postMessage).toHaveBeenCalledWith({
      id: 7,
      payload: response,
    });
  });

  it("posts error responses when the transform throws", async () => {
    transformSvgRequest.mockRejectedValue(
      new Error("Worker parser unavailable"),
    );

    await import("./svg-transform.worker");

    messageHandler?.({
      data: {
        id: 8,
        payload: {
          svg: "<svg />",
        },
      },
    } as MessageEvent<WorkerRequestMessage>);
    await Promise.resolve();
    await Promise.resolve();

    expect(workerScope.postMessage).toHaveBeenCalledWith({
      id: 8,
      payload: {
        kind: "error",
        message: "Worker parser unavailable",
      },
    });
  });
});
