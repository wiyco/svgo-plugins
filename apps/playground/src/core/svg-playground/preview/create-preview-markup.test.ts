import { describe, expect, it } from "vitest";

import { createPreviewMarkup } from "./create-preview-markup";

const parseSvg = (svg: string): Element => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== "svg") {
    throw new Error("Expected a root svg element.");
  }

  return rootElement;
};

describe("create-preview-markup", () => {
  it("applies runtime preview overrides on the root svg element", () => {
    const markup = createPreviewMarkup(
      '<svg data-preview="icon" style="fill: none" viewBox="0 0 24 24"><path d="M0 0L24 24" /></svg>',
      {
        ariaLabel: "Live preview",
        color: "#ff6600",
        size: 128,
        strokeWidth: 2.5,
      },
    );
    const rootElement = parseSvg(markup);

    expect(rootElement.getAttribute("aria-label")).toBe("Live preview");
    expect(rootElement.getAttribute("data-preview")).toBe("icon");
    expect(rootElement.getAttribute("height")).toBe("128");
    expect(rootElement.getAttribute("stroke-width")).toBe("2.5");
    expect(rootElement.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(rootElement.getAttribute("width")).toBe("128");
    expect(rootElement.getAttribute("style")).toContain("fill: none");
    expect(rootElement.getAttribute("style")).toContain("color: #ff6600");
    expect(rootElement.querySelector("path")).not.toBeNull();
  });

  it("appends preview color when the source style already ends with a semicolon", () => {
    const markup = createPreviewMarkup(
      '<svg style="fill: none;" viewBox="0 0 24 24" />',
      {
        ariaLabel: "Live preview",
        color: "#0f766e",
        size: 96,
        strokeWidth: 1.5,
      },
    );
    const rootElement = parseSvg(markup);

    expect(rootElement.getAttribute("style")).toContain("fill: none;");
    expect(rootElement.getAttribute("style")).toContain("color: #0f766e");
  });

  it("throws when the optimized svg does not have a root svg element", () => {
    expect(() => {
      createPreviewMarkup("<g />", {
        ariaLabel: "Live preview",
        color: "#ff6600",
        size: 128,
        strokeWidth: 2.5,
      });
    }).toThrow("Expected optimized SVG to contain a root <svg> element.");
  });
});
