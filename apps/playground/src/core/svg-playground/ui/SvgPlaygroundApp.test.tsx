import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn, TransformWorkerFactory } from "../model";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlaygroundApp } from "./SvgPlaygroundPage";

const { useWorkerTransform } = vi.hoisted(() => {
  return {
    useWorkerTransform:
      vi.fn<(createWorker: TransformWorkerFactory) => TransformFn | null>(),
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

const createWorkerStub: TransformWorkerFactory = () => {
  throw new Error("should not create worker during app shell test");
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
          createWorker={createWorkerStub}
          definition={hoistStrokeWidthPlayground}
        />,
      );
      await flush();
    });

    expect(container.textContent).toContain("Booting the transform worker");
    expect(container.textContent).toContain(
      "SVGO plugin playground for hoisting stroke width",
    );
    expect(container.textContent).toContain("/svgo-plugin-hoist-stroke-width");
    expect(container.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );

    const slug = container.querySelector<HTMLAnchorElement>(".slug-chip");
    expect(slug?.getAttribute("href")).toBe("../");
  });

  it("renders the shared page once the worker transform is available", async () => {
    useWorkerTransform.mockReturnValue(createTransformStub());

    await act(async () => {
      root.render(
        <SvgPlaygroundApp
          createWorker={createWorkerStub}
          definition={hoistStrokeWidthPlayground}
        />,
      );
      await flush();
    });

    expect(container.textContent).toContain(
      "SVGO plugin playground for hoisting stroke width",
    );
  });
});
