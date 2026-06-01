import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../../model";

import { useSvgTransformState } from "./use-svg-transform-state";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

type HarnessProps = {
  svg: string;
  transform: TransformFn;
};

const TransformStateHarness = ({ svg, transform }: HarnessProps) => {
  const transformState = useSvgTransformState(svg, transform);

  return (
    <div>
      <output data-testid="kind">{transformState.kind}</output>
      <output data-testid="message">
        {"message" in transformState ? transformState.message : ""}
      </output>
      <output data-testid="optimized">
        {"optimizedSvg" in transformState ? transformState.optimizedSvg : ""}
      </output>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
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

describe("use-svg-transform-state", () => {
  it("stays idle for blank svg input", async () => {
    const transform = vi.fn<TransformFn>(async () => {
      return {
        kind: "success",
        optimizedSvg: "<svg />",
      };
    });

    await act(async () => {
      root.render(<TransformStateHarness svg="   " transform={transform} />);
      await flush();
    });

    expect(transform).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="kind"]')?.textContent).toBe(
      "idle",
    );
  });

  it("trims svg input and returns success state", async () => {
    const transform = vi.fn<TransformFn>(async () => {
      return {
        kind: "success",
        optimizedSvg: "<svg data-optimized />",
      };
    });

    await act(async () => {
      root.render(
        <TransformStateHarness
          svg={"  <svg viewBox='0 0 24 24' />  "}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(transform).toHaveBeenCalledWith({
      svg: "<svg viewBox='0 0 24 24' />",
    });
    expect(container.querySelector('[data-testid="kind"]')?.textContent).toBe(
      "success",
    );
    expect(
      container.querySelector('[data-testid="optimized"]')?.textContent,
    ).toBe("<svg data-optimized />");
  });

  it("returns unsafe and error states from transform failures", async () => {
    const transform = vi.fn<TransformFn>();

    transform.mockResolvedValueOnce({
      kind: "unsafe",
      reason: "blocked",
    });
    transform.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      root.render(
        <TransformStateHarness
          svg={"<svg viewBox='0 0 24 24' />"}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(container.querySelector('[data-testid="kind"]')?.textContent).toBe(
      "unsafe",
    );
    expect(
      container.querySelector('[data-testid="message"]')?.textContent,
    ).toBe("blocked");

    await act(async () => {
      root.render(
        <TransformStateHarness
          svg={"<svg viewBox='0 0 24 24'><path /></svg>"}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(container.querySelector('[data-testid="kind"]')?.textContent).toBe(
      "error",
    );
    expect(
      container.querySelector('[data-testid="message"]')?.textContent,
    ).toBe("boom");
  });
});
