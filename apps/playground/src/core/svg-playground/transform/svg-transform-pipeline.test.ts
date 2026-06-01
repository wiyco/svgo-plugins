import { transformSync as transformJsxWithOxc } from "oxc-transform";
import { describe, expect, it, vi } from "vitest";

import { createPreviewComponentFromJs } from "../preview/create-preview-component";
import {
  createSvgTransformRequestHandler,
  svgToReactSource,
} from "./svg-transform-pipeline";

describe("svg-transform-pipeline", () => {
  it("returns optimized svg and preview code for safe markup", async () => {
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
    expect(result.reactSource).not.toMatch(/\bimport\b/);
    expect(result.reactSource).not.toMatch(/\bexport\b/);
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

  it("turns JSX source into a callable SvgComponent via oxc-transform", async () => {
    const reactSource = await svgToReactSource(
      `<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" /></svg>`,
    );
    const previewCode = transformJsxWithOxc("SvgComponent.jsx", reactSource, {
      jsx: {
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
        runtime: "classic",
      },
      lang: "jsx",
      target: "es2020",
    }).code.trim();
    const Preview = createPreviewComponentFromJs(previewCode);

    expect(previewCode).toContain("React.createElement");
    expect(typeof Preview).toBe("function");
  });
});
