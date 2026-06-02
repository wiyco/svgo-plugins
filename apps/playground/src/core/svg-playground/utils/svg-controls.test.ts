import { describe, expect, it } from "vitest";

import {
  type SvgControls,
  applyControlsToSvg,
  extractControlsFromSvg,
} from "./svg-controls";

const FALLBACK_CONTROLS: SvgControls = {
  color: "#155eef",
  size: 184,
  strokeWidth: 2,
};

const parseSvg = (svg: string): Element => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== "svg") {
    throw new Error("Expected a root svg element.");
  }

  return rootElement;
};

describe("svg-controls", () => {
  it("applies size, color, and stroke width while preserving other root styles", () => {
    const nextSvg = applyControlsToSvg(
      '<svg color="#0f766e" style="fill: none; opacity: 0.8" viewBox="0 0 24 24"><g stroke-width="1.25"><path d="M0 0L24 24" stroke-width="3" /></g></svg>',
      {
        color: "#ff6600",
        size: 256,
        strokeWidth: 2.5,
      },
    );
    const rootElement = parseSvg(nextSvg);

    expect(rootElement.getAttribute("width")).toBe("256");
    expect(rootElement.getAttribute("height")).toBe("256");
    expect(rootElement.getAttribute("color")).toBeNull();
    expect(rootElement.getAttribute("style")).toContain("fill: none");
    expect(rootElement.getAttribute("style")).toContain("opacity: 0.8");
    expect(rootElement.getAttribute("style")).toContain("color: #ff6600");
    expect(rootElement.querySelector("g")?.getAttribute("stroke-width")).toBe(
      "2.5",
    );
    expect(
      rootElement.querySelector("path")?.getAttribute("stroke-width"),
    ).toBe("2.5");
  });

  it("adds a root stroke-width when the source does not declare one", () => {
    const nextSvg = applyControlsToSvg(
      '<svg viewBox="0 0 24 24"><path d="M0 0L24 24" /></svg>',
      FALLBACK_CONTROLS,
    );
    const rootElement = parseSvg(nextSvg);

    expect(rootElement.getAttribute("stroke-width")).toBe("2");
    expect(
      rootElement.querySelector("path")?.hasAttribute("stroke-width"),
    ).toBe(false);
  });

  it("can preserve mixed stroke-width values while still applying size and color", () => {
    const nextSvg = applyControlsToSvg(
      '<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke-width="1.25" /><path d="M24 0L0 24" stroke-width="2.5" /></svg>',
      {
        color: "#ff6600",
        size: 256,
        strokeWidth: 4,
      },
      {
        preserveStrokeWidthVariations: true,
      },
    );
    const rootElement = parseSvg(nextSvg);
    const paths = rootElement.querySelectorAll("path");

    expect(rootElement.getAttribute("width")).toBe("256");
    expect(rootElement.getAttribute("height")).toBe("256");
    expect(rootElement.getAttribute("style")).toContain("color: #ff6600");
    expect(paths[0]?.getAttribute("stroke-width")).toBe("1.25");
    expect(paths[1]?.getAttribute("stroke-width")).toBe("2.5");
  });

  it("extracts root width, style color, and uniform stroke width", () => {
    expect(
      extractControlsFromSvg(
        '<svg width="128" height="192" style="fill: none; color: #0F766E" viewBox="0 0 24 24"><path d="M0 0L24 24" stroke-width="3.5" /></svg>',
        FALLBACK_CONTROLS,
      ),
    ).toEqual({
      color: "#0f766e",
      size: 128,
      strokeWidth: 3.5,
    });
  });

  it("keeps the fallback stroke width when the svg has mixed stroke-width values", () => {
    expect(
      extractControlsFromSvg(
        '<svg width="96" color="#abc" viewBox="0 0 24 24"><path d="M0 0L24 24" stroke-width="1.25" /><path d="M24 0L0 24" stroke-width="2.5" /></svg>',
        FALLBACK_CONTROLS,
      ),
    ).toEqual({
      color: "#aabbcc",
      size: 96,
      strokeWidth: 2,
    });
  });

  it("falls back cleanly when the svg cannot be parsed", () => {
    expect(
      applyControlsToSvg("<g />", {
        color: "#ff6600",
        size: 256,
        strokeWidth: 2.5,
      }),
    ).toBe("<g />");
    expect(extractControlsFromSvg("<g />", FALLBACK_CONTROLS)).toEqual(
      FALLBACK_CONTROLS,
    );
  });
});
