import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransformFn,
  TransformWorkerFactory,
  WorkerTransformClient,
} from "../model";

import { useWorkerTransform } from "./use-svg-transform-worker";

const { createTransformWorkerClient } = vi.hoisted(() => {
  return {
    createTransformWorkerClient:
      vi.fn<(createWorker: TransformWorkerFactory) => WorkerTransformClient>(),
  };
});

vi.mock("./svg-transform-worker-client", () => {
  return {
    createTransformWorkerClient,
  };
});

type HarnessProps = {
  createWorker: TransformWorkerFactory;
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createTransformStub = (): TransformFn => {
  return async () => {
    return {
      kind: "success",
      optimizedSvg: "<svg />",
    };
  };
};

const firstCreateWorker: TransformWorkerFactory = () => {
  throw new Error("should not execute in hook test");
};

const secondCreateWorker: TransformWorkerFactory = () => {
  throw new Error("should not execute in hook test");
};

const HookHarness = ({ createWorker }: HarnessProps) => {
  const transform = useWorkerTransform(createWorker);

  return (
    <output data-transform-ready={transform === null ? "no" : "yes"}>
      {transform === null ? "idle" : "ready"}
    </output>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  createTransformWorkerClient.mockReset();
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });
});

describe("use-svg-transform-worker", () => {
  it("creates and disposes worker clients as the worker url changes", async () => {
    const firstDispose = vi.fn<() => void>();
    const secondDispose = vi.fn<() => void>();

    createTransformWorkerClient
      .mockReturnValueOnce({
        dispose: firstDispose,
        transform: createTransformStub(),
      })
      .mockReturnValueOnce({
        dispose: secondDispose,
        transform: createTransformStub(),
      });

    await act(async () => {
      root.render(<HookHarness createWorker={firstCreateWorker} />);
      await flush();
    });

    expect(container.textContent).toBe("ready");

    await act(async () => {
      root.render(<HookHarness createWorker={secondCreateWorker} />);
      await flush();
    });

    expect(createTransformWorkerClient).toHaveBeenNthCalledWith(
      1,
      firstCreateWorker,
    );
    expect(createTransformWorkerClient).toHaveBeenNthCalledWith(
      2,
      secondCreateWorker,
    );
    expect(firstDispose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
      await flush();
    });

    expect(secondDispose).toHaveBeenCalledTimes(1);
  });
});
