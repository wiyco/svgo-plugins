import { describe, expect, it } from "vitest";

import { getPlaygroundViewTransitionNames } from "./view-transition-names";

describe("view-transition-names", () => {
  it("sanitizes playground slugs into stable view transition tokens", () => {
    expect(getPlaygroundViewTransitionNames(" SVG Playground / Demo ")).toEqual(
      {
        slug: "playground-slug-svg-playground-demo",
        title: "playground-title-svg-playground-demo",
      },
    );
  });

  it("falls back to the generic token when sanitization removes every character", () => {
    expect(getPlaygroundViewTransitionNames(" !!! ")).toEqual({
      slug: "playground-slug-playground",
      title: "playground-title-playground",
    });
  });
});
