import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvgPlaygroundDefinition } from "../../core/svg-playground/model";

import App from "./App";
import { hoistStrokeWidthPlayground } from "./definition";

const { SvgPlaygroundApp } = vi.hoisted(() => {
  return {
    SvgPlaygroundApp: vi.fn<
      (props: {
        definition: SvgPlaygroundDefinition;
        workerUrl: URL;
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

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  SvgPlaygroundApp.mockClear();
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

describe("playground App", () => {
  it("wires the shared playground shell to the hoist-stroke-width definition", async () => {
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    const props = SvgPlaygroundApp.mock.lastCall?.[0] as
      | { definition: SvgPlaygroundDefinition; workerUrl: URL }
      | undefined;

    expect(container.querySelector('[data-app="playground"]')).not.toBeNull();
    expect(props?.definition).toBe(hoistStrokeWidthPlayground);
    expect(props?.workerUrl).toBeInstanceOf(URL);
    expect(String(props?.workerUrl)).toContain("svg-transform.worker.ts");
  });
});
