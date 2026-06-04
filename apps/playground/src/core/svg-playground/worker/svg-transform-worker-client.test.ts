import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { WorkerRequestMessage, WorkerResponseMessage } from "../model";

import { createTransformWorkerClient } from "./svg-transform-worker-client";

type WorkerListener = (event: MessageEvent<WorkerResponseMessage>) => void;
type ErrorListener = (event: ErrorEvent) => void;

class MockWorker {
  static instances: MockWorker[] = [];

  readonly errorListeners: ErrorListener[] = [];
  readonly messageListeners: WorkerListener[] = [];
  readonly postedMessages: WorkerRequestMessage[] = [];
  terminated = false;

  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    MockWorker.instances.push(this);
  }

  addEventListener(type: "error", listener: ErrorListener): void;
  addEventListener(type: "message", listener: WorkerListener): void;
  addEventListener(
    type: "error" | "message",
    listener: ErrorListener | WorkerListener,
  ): void {
    if (type === "error") {
      this.errorListeners.push(listener as ErrorListener);
      return;
    }

    this.messageListeners.push(listener as WorkerListener);
  }

  dispatchError(message = ""): void {
    for (const listener of this.errorListeners) {
      listener({ message } as ErrorEvent);
    }
  }

  dispatchMessage(data: WorkerResponseMessage): void {
    for (const listener of this.messageListeners) {
      listener({ data } as MessageEvent<WorkerResponseMessage>);
    }
  }

  postMessage(message: WorkerRequestMessage): void {
    this.postedMessages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }
}

const originalWorker = globalThis.Worker;

beforeEach(() => {
  MockWorker.instances = [];
  globalThis.Worker = MockWorker as unknown as typeof Worker;
});

afterEach(() => {
  globalThis.Worker = originalWorker;
});

describe("svg-transform-worker-client", () => {
  it("posts requests and resolves matching worker responses", async () => {
    const workerUrl = new URL("https://example.com/transform.worker.js");
    const client = createTransformWorkerClient(() => {
      return new Worker(workerUrl, { type: "module" });
    });
    const worker = MockWorker.instances[0];
    const payload = {
      kind: "success",
      optimizedSvg: "<svg data-optimized />",
    } as const;
    const resultPromise = client.transform({
      svg: "<svg />",
    });

    expect(worker?.options).toEqual({
      type: "module",
    });
    expect(worker?.postedMessages).toEqual([
      {
        id: 0,
        payload: {
          svg: "<svg />",
        },
      },
    ]);

    worker?.dispatchMessage({
      id: 999,
      payload: {
        kind: "error",
        message: "ignored",
      },
    });
    worker?.dispatchMessage({
      id: 0,
      payload,
    });

    await expect(resultPromise).resolves.toEqual(payload);
  });

  it("rejects pending requests when the worker crashes", async () => {
    const client = createTransformWorkerClient(() => {
      return new Worker(new URL("https://example.com/transform.worker.js"), {
        type: "module",
      });
    });
    const worker = MockWorker.instances[0];
    const resultPromise = client.transform({
      svg: "<svg />",
    });

    worker?.dispatchError();

    await expect(resultPromise).rejects.toThrow("Transform worker crashed.");
  });

  it("rejects pending requests and terminates the worker on dispose", async () => {
    const client = createTransformWorkerClient(() => {
      return new Worker(new URL("https://example.com/transform.worker.js"), {
        type: "module",
      });
    });
    const worker = MockWorker.instances[0];
    const resultPromise = client.transform({
      svg: "<svg />",
    });

    client.dispose();

    await expect(resultPromise).rejects.toThrow("Transform worker stopped.");
    expect(worker?.terminated).toBe(true);
  });

  it("keeps only the latest queued request while a transform is already in flight", async () => {
    const client = createTransformWorkerClient(() => {
      return new Worker(new URL("https://example.com/transform.worker.js"), {
        type: "module",
      });
    });
    const worker = MockWorker.instances[0];
    const firstResultPromise = client.transform({
      svg: "<svg data-id='first' />",
    });
    const secondResultPromise = client.transform({
      svg: "<svg data-id='second' />",
    });
    const thirdResultPromise = client.transform({
      svg: "<svg data-id='third' />",
    });

    expect(worker?.postedMessages).toEqual([
      {
        id: 0,
        payload: {
          svg: "<svg data-id='first' />",
        },
      },
    ]);

    await expect(secondResultPromise).rejects.toThrow(
      "Transform request superseded by newer input.",
    );

    worker?.dispatchMessage({
      id: 0,
      payload: {
        kind: "success",
        optimizedSvg: "<svg data-result='first' />",
      },
    });

    expect(worker?.postedMessages).toEqual([
      {
        id: 0,
        payload: {
          svg: "<svg data-id='first' />",
        },
      },
      {
        id: 2,
        payload: {
          svg: "<svg data-id='third' />",
        },
      },
    ]);

    worker?.dispatchMessage({
      id: 2,
      payload: {
        kind: "success",
        optimizedSvg: "<svg data-result='third' />",
      },
    });

    await expect(firstResultPromise).resolves.toEqual({
      kind: "success",
      optimizedSvg: "<svg data-result='first' />",
    });
    await expect(thirdResultPromise).resolves.toEqual({
      kind: "success",
      optimizedSvg: "<svg data-result='third' />",
    });
  });

  it("ignores premature queued responses and supersedes stale queued work safely", async () => {
    const client = createTransformWorkerClient(() => {
      return new Worker(new URL("https://example.com/transform.worker.js"), {
        type: "module",
      });
    });
    const worker = MockWorker.instances[0];
    const firstResultPromise = client.transform({
      svg: "<svg data-id='first' />",
    });
    client.transform({
      svg: "<svg data-id='second' />",
    });

    worker?.dispatchMessage({
      id: 1,
      payload: {
        kind: "success",
        optimizedSvg: "<svg data-result='second' />",
      },
    });

    const thirdResultPromise = client.transform({
      svg: "<svg data-id='third' />",
    });

    expect(worker?.postedMessages).toEqual([
      {
        id: 0,
        payload: {
          svg: "<svg data-id='first' />",
        },
      },
    ]);

    worker?.dispatchMessage({
      id: 0,
      payload: {
        kind: "success",
        optimizedSvg: "<svg data-result='first' />",
      },
    });
    worker?.dispatchMessage({
      id: 2,
      payload: {
        kind: "success",
        optimizedSvg: "<svg data-result='third' />",
      },
    });

    await expect(firstResultPromise).resolves.toEqual({
      kind: "success",
      optimizedSvg: "<svg data-result='first' />",
    });
    await expect(thirdResultPromise).resolves.toEqual({
      kind: "success",
      optimizedSvg: "<svg data-result='third' />",
    });
  });
});
