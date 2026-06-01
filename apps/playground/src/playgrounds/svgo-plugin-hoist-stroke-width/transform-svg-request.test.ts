import { describe, expect, it } from "vitest";

import { SVG_PRESETS } from "./definition";
import { transformSvgRequest } from "./transform-svg-request";

describe("transform-svg-request", () => {
  it("hoists a uniform descendant stroke width to the svg root", async () => {
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
  });
});
