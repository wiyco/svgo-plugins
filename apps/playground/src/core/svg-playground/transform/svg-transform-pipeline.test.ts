import { describe, expect, it, vi } from "vitest";

import { createSvgTransformRequestHandler } from "./svg-transform-pipeline";

describe("svg-transform-pipeline", () => {
  it("returns optimized svg and react source for safe markup", async () => {
    const optimizeSvg = vi.fn<(svg: string) => string>((svg) => svg);
    const transformSvgRequest = createSvgTransformRequestHandler({
      optimizeSvg,
    });

    const result = await transformSvgRequest({
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" stroke-width="2" /></svg>`,
    });

    expect(optimizeSvg).toHaveBeenCalledTimes(1);
    expect(result.kind).toBe("success");

    if (result.kind !== "success") {
      return;
    }

    expect(result.optimizedSvg.startsWith("<svg")).toBe(true);
  });

  it("blocks unsafe svg before running the rest of the pipeline", async () => {
    const optimizeSvg = vi.fn<(svg: string) => string>((svg) => svg);
    const transformSvgRequest = createSvgTransformRequestHandler({
      optimizeSvg,
    });
    const result = await transformSvgRequest({
      svg: `<svg viewBox="0 0 24 24"><script>alert("preview blocked")</script></svg>`,
    });

    expect(result).toMatchObject({
      kind: "unsafe",
    });
    expect(optimizeSvg).not.toHaveBeenCalled();
  });

  it("returns the original error message when optimization fails", async () => {
    const transformSvgRequest = createSvgTransformRequestHandler({
      optimizeSvg: () => {
        throw new Error("SVGO failed");
      },
    });
    const result = await transformSvgRequest({
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" /></svg>`,
    });

    expect(result).toEqual({
      kind: "error",
      message: "SVGO failed",
    });
  });

  it("returns a fallback error message for non-Error failures", async () => {
    const transformSvgRequest = createSvgTransformRequestHandler({
      optimizeSvg: () => {
        throw "nope";
      },
    });
    const result = await transformSvgRequest({
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" /></svg>`,
    });

    expect(result).toEqual({
      kind: "error",
      message: "Unexpected transform failure.",
    });
  });
});
