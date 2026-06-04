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
  it("adds only the preview aria label while preserving svg attributes", () => {
    const markup = createPreviewMarkup(
      '<svg data-preview="icon" height="128" stroke-width="2.5" style="fill: none; color: #ff6600" viewBox="0 0 24 24" width="128"><path d="M0 0L24 24" /></svg>',
      {
        ariaLabel: "Live preview",
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

  it("preserves existing style declarations without appending overrides", () => {
    const markup = createPreviewMarkup(
      '<svg style="fill: none;" viewBox="0 0 24 24" />',
      {
        ariaLabel: "Live preview",
      },
    );
    const rootElement = parseSvg(markup);

    expect(rootElement.getAttribute("style")).toBe("fill: none;");
  });

  it("throws when the optimized svg does not have a root svg element", () => {
    expect(() => {
      createPreviewMarkup("<g />", {
        ariaLabel: "Live preview",
      });
    }).toThrow("Expected optimized SVG to contain a root <svg> element.");
  });

  it("throws when the optimized svg contains unsafe markup", () => {
    expect(() => {
      createPreviewMarkup(
        '<svg><image href="https://example.com/icon.svg" /></svg>',
        {
          ariaLabel: "Live preview",
        },
      );
    }).toThrow("Remote URLs are blocked in the playground preview.");
  });
});
