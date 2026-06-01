import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../model";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlaygroundPage } from "./SvgPlaygroundPage";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  window.history.replaceState(null, "", "/");
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

describe("SvgPlaygroundPage", () => {
  it("renders optimized output from the transform controller", async () => {
    const transform = vi.fn<TransformFn>(async () => {
      return {
        kind: "success",
        optimizedSvg:
          '<svg data-optimized="yes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />',
      };
    });

    await act(async () => {
      root.render(
        <SvgPlaygroundPage
          definition={hoistStrokeWidthPlayground}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(transform).toHaveBeenCalledWith({
      svg: hoistStrokeWidthPlayground.defaultState.svg,
    });
    expect(container.textContent).toContain('data-optimized="yes"');
    expect(container.textContent).toContain("Generated React source");
    expect(container.textContent).toContain("success");
  });
});
