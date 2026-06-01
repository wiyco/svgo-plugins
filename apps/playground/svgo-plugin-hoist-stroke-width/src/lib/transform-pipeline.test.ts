import { transformSync as transformJsxWithOxc } from "oxc-transform";
import { describe, expect, it } from "vitest";

import { SVG_PRESETS } from "./presets";
import { createPreviewComponentFromJs } from "./preview-component";
import { svgToReactSource, transformSvgRequest } from "./transform-pipeline";

describe("transform-pipeline", () => {
  it("returns optimized svg and preview code for a safe preset", async () => {
    const result = await transformSvgRequest({
      svg: SVG_PRESETS[0]?.svg ?? "",
    });

    expect(result.kind).toBe("success");

    if (result.kind !== "success") {
      return;
    }

    const strokeWidthMatches =
      result.optimizedSvg.match(/stroke-width="2"/g) ?? [];

    expect(result.optimizedSvg.startsWith("<svg")).toBe(true);
    expect(strokeWidthMatches).toHaveLength(1);
    expect(result.reactSource).not.toMatch(/\bimport\b/);
    expect(result.reactSource).not.toMatch(/\bexport\b/);
  });

  it("blocks unsafe svg before running the rest of the pipeline", async () => {
    const result = await transformSvgRequest({
      svg: SVG_PRESETS[2]?.svg ?? "",
    });

    expect(result).toMatchObject({
      kind: "unsafe",
    });
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
