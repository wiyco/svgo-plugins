import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  SvgPlaygroundDefinition,
  TransformWorkerFactory,
} from "../../core/svg-playground/model";

import App from "./App";
import { hoistStrokeWidthPlayground } from "./definition";

const { SvgPlaygroundApp } = vi.hoisted(() => {
  return {
    SvgPlaygroundApp: vi.fn<
      (props: {
        createWorker: TransformWorkerFactory;
        definition: SvgPlaygroundDefinition;
      }) => unknown
    >(() => {
      return <div data-app="playground" />;
    }),
  };
});

vi.mock("../../core/svg-playground/ui/SvgPlaygroundPage", () => {
  return {
    SvgPlaygroundApp,
  };
});

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

let container: HTMLDivElement;
let root: Root;
let originalWorker: typeof Worker;
const workerConstructor =
  vi.fn<(url: URL, options?: WorkerOptions) => Worker>();

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  SvgPlaygroundApp.mockClear();
  originalWorker = globalThis.Worker;
  globalThis.Worker = workerConstructor as unknown as typeof Worker;
  workerConstructor.mockReset();
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });

  globalThis.Worker = originalWorker;
});

describe("playground App", () => {
  it("wires the shared playground shell to the hoist-stroke-width definition", async () => {
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    const props = SvgPlaygroundApp.mock.lastCall?.[0] as
      | {
          createWorker: TransformWorkerFactory;
          definition: SvgPlaygroundDefinition;
        }
      | undefined;

    expect(container.querySelector('[data-app="playground"]')).not.toBeNull();
    expect(props?.definition).toBe(hoistStrokeWidthPlayground);
    expect(typeof props?.createWorker).toBe("function");

    props?.createWorker();

    expect(workerConstructor).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        type: "module",
      }),
    );
    expect(String(workerConstructor.mock.calls[0]?.[0])).toContain(
      "svg-transform.worker.ts",
    );
  });
});
