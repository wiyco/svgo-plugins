import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../model";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlaygroundApp } from "./SvgPlaygroundPage";

const { useWorkerTransform } = vi.hoisted(() => {
  return {
    useWorkerTransform: vi.fn<(workerUrl: URL) => TransformFn | null>(),
  };
});

vi.mock("../worker/use-svg-transform-worker", () => {
  return {
    useWorkerTransform,
  };
});

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createTransformStub = (): TransformFn => {
  return async () => {
    return {
      kind: "success",
      optimizedSvg: "<svg data-optimized />",
    };
  };
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  useWorkerTransform.mockReset();
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

describe("SvgPlaygroundApp", () => {
  it("shows a boot placeholder until the worker hook returns a transform", async () => {
    useWorkerTransform.mockReturnValue(null);

    await act(async () => {
      root.render(
        <SvgPlaygroundApp
          definition={hoistStrokeWidthPlayground}
          workerUrl={new URL("https://example.com/transform.worker.js")}
        />,
      );
      await flush();
    });

    expect(container.textContent).toContain("Booting the transform worker");
  });

  it("renders the shared page once the worker transform is available", async () => {
    useWorkerTransform.mockReturnValue(createTransformStub());

    await act(async () => {
      root.render(
        <SvgPlaygroundApp
          definition={hoistStrokeWidthPlayground}
          workerUrl={new URL("https://example.com/transform.worker.js")}
        />,
      );
      await flush();
    });

    expect(container.textContent).toContain(
      "SVGO plugin playground for hoisting stroke width",
    );
  });
});
