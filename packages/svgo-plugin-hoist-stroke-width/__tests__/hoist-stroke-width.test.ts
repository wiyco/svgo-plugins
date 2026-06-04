import type { XastChild, XastElement } from "svgo";

import { optimize } from "svgo";
import { describe, expect, it } from "vitest";

import { hoistStrokeWidthToSvgRoot } from "../src/hoist-stroke-width";
import { createHoistStrokeWidthPlugin } from "../src/index";

const createElement = (
  name: string,
  attributes: Record<string, string> = {},
  children: XastChild[] = [],
): XastElement => {
  return {
    type: "element",
    name,
    attributes,
    children,
  };
};

const createText = (value: string): XastChild => {
  return {
    type: "text",
    value,
  };
};

const getChildElement = (node: XastElement, index: number): XastElement => {
  const child = node.children[index];

  if (child === undefined || child.type !== "element") {
    throw new Error(`Expected an element child at index ${index}`);
  }

  return child;
};

describe("hoistStrokeWidthToSvgRoot", () => {
  it("moves a uniform descendant stroke-width to the svg root", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2.0",
      }),
      createText("\n"),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const firstChild = getChildElement(svg, 0);
    const secondChild = getChildElement(svg, 1);

    expect(changed).toBe(true);
    expect(svg.attributes["stroke-width"]).toBe("2");
    expect(firstChild).toMatchObject({
      attributes: {
        stroke: "currentColor",
      },
    });
    expect(secondChild).toMatchObject({
      attributes: {
        stroke: "currentColor",
      },
    });
    expect(firstChild.attributes["stroke-width"]).toBeUndefined();
    expect(secondChild.attributes["stroke-width"]).toBeUndefined();
  });

  it("keeps an existing svg root stroke-width and removes duplicate descendants", () => {
    const svg = createElement("svg", { "stroke-width": "2" }, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const firstChild = getChildElement(svg, 0);

    expect(changed).toBe(true);
    expect(svg.attributes["stroke-width"]).toBe("2");
    expect(firstChild.attributes["stroke-width"]).toBeUndefined();
  });

  it("does not hoist when the svg root already has a conflicting stroke-width", () => {
    const svg = createElement("svg", { "stroke-width": "3" }, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const firstChild = getChildElement(svg, 0);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBe("3");
    expect(firstChild.attributes["stroke-width"]).toBe("2");
  });

  it("preserves non-numeric stroke-width values when hoisting", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "var(--icon-stroke)",
      }),
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "var(--icon-stroke)",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);

    expect(changed).toBe(true);
    expect(svg.attributes["stroke-width"]).toBe("var(--icon-stroke)");
  });

  it("does not hoist when a stroked descendant would change width", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
      createElement("path", {
        stroke: "currentColor",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const firstChild = getChildElement(svg, 0);
    const secondChild = getChildElement(svg, 1);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBeUndefined();
    expect(firstChild.attributes["stroke-width"]).toBe("2");
    expect(secondChild.attributes["stroke-width"]).toBeUndefined();
  });

  it("does not hoist when descendant stroke-width values are mixed", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "1.5",
      }),
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBeUndefined();
  });

  it("does not hoist when descendants have no explicit stroke-width", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        stroke: "currentColor",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBeUndefined();
  });

  it("does not hoist when stroke-width exists without any stroked graphics", () => {
    const svg = createElement("svg", {}, [
      createElement(
        "g",
        {
          "stroke-width": "2",
        },
        [createElement("path"), createText("ignored")],
      ),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const group = getChildElement(svg, 0);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBeUndefined();
    expect(group.attributes["stroke-width"]).toBe("2");
  });

  it("hoists stroke-width from an inherited group when the effective width stays uniform", () => {
    const svg = createElement("svg", {}, [
      createElement(
        "g",
        {
          stroke: "currentColor",
          "stroke-width": "2",
        },
        [
          createElement("path", {
            stroke: "currentColor",
          }),
        ],
      ),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);
    const firstChild = getChildElement(svg, 0);

    expect(changed).toBe(true);
    expect(svg.attributes["stroke-width"]).toBe("2");
    expect(firstChild.attributes["stroke-width"]).toBeUndefined();
  });

  it("does not touch svg files that use stroke-related inline styles", () => {
    const svg = createElement("svg", {}, [
      createElement("path", {
        style: "stroke-width: 2; stroke: currentColor;",
      }),
      createElement("path", {
        stroke: "currentColor",
        "stroke-width": "2",
      }),
    ]);

    const changed = hoistStrokeWidthToSvgRoot(svg);

    expect(changed).toBe(false);
    expect(svg.attributes["stroke-width"]).toBeUndefined();
  });

  it("returns false for non-svg nodes", () => {
    const path = createElement("path", {
      stroke: "currentColor",
      "stroke-width": "2",
    });

    const changed = hoistStrokeWidthToSvgRoot(path);

    expect(changed).toBe(false);
    expect(path.attributes["stroke-width"]).toBe("2");
  });
});

describe("createHoistStrokeWidthPlugin", () => {
  it("hoists stroke-width during svgo traversal", () => {
    const result = optimize(
      '<svg><path stroke="currentColor" stroke-width="2" /><path stroke="currentColor" stroke-width="2.0" /></svg>',
      {
        plugins: [createHoistStrokeWidthPlugin()],
      },
    );

    expect(result.data).toContain('<svg stroke-width="2">');
    expect(result.data).not.toContain("path stroke-width=");
  });
});
