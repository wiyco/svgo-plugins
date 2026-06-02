import { describe, expect, it } from "vitest";

import { createReactSource } from "./create-react-source";

describe("create-react-source", () => {
  it("creates a self-contained React component source from optimized SVG", () => {
    const source = createReactSource(
      '<svg viewBox="0 0 24 24" stroke-width="2" data-source="mixed"><path stroke-linecap="round" /></svg>',
    );

    expect(source).toContain("const SvgComponent = (props) => (");
    expect(source).toContain('strokeWidth="2"');
    expect(source).toContain('data-source="mixed"');
    expect(source).toContain('strokeLinecap="round"');
    expect(source).toContain("{...props}");
    expect(source).not.toMatch(/\bimport\b/);
    expect(source).not.toMatch(/\bexport\b/);
  });

  it("converts inline styles and text nodes into JSX-safe expressions", () => {
    const source = createReactSource(
      '<svg style="fill: none; --icon-color: currentColor"><text>Hello</text></svg>',
    );

    expect(source).toContain(
      'style={{ fill: "none", "--icon-color": "currentColor" }}',
    );
    expect(source).toContain('{"Hello"}');
  });

  it("maps generic HTML-style attributes and quotes invalid style property names", () => {
    const source = createReactSource(
      '<svg class="icon" style="1fill: red"><text for="label">Hello</text></svg>',
    );

    expect(source).toContain('className="icon"');
    expect(source).toContain('htmlFor="label"');
    expect(source).toContain('style={{ "1fill": "red" }}');
  });

  it("drops inline style attributes when every declaration is invalid", () => {
    const source = createReactSource(
      '<svg style="broken; fill:"><text>Hello</text></svg>',
    );

    expect(source).not.toContain("style={{");
  });

  it("throws when optimized SVG has no root svg element", () => {
    expect(() => {
      createReactSource("<g />");
    }).toThrow("Expected optimized SVG to contain a root <svg> element.");
  });

  it("throws when optimized SVG contains unsafe markup", () => {
    expect(() => {
      createReactSource(
        '<svg><style>@import "https://example.com/a.css";</style></svg>',
      );
    }).toThrow("Style elements are blocked in the playground preview.");
  });
});
