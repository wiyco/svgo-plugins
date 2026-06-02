import { describe, expect, it } from "vitest";

import { createLandingPageViewModel } from "./landing-page-view-model";

describe("landing-page-view-model", () => {
  it("builds hrefs, plural preset labels, and transition names from catalog entries", () => {
    const viewModel = createLandingPageViewModel([
      {
        packageName: "@scope/example-playground",
        presetCount: 3,
        slug: "example-playground",
        summary: "Example summary",
        title: "Example title",
      },
    ]);

    expect(viewModel).toEqual({
      playgrounds: [
        {
          href: "./example-playground/",
          packageName: "@scope/example-playground",
          presetCountLabel: "3 presets",
          slug: "example-playground",
          slugTransitionName: "playground-slug-example-playground",
          summary: "Example summary",
          title: "Example title",
          titleTransitionName: "playground-title-example-playground",
        },
      ],
    });
  });

  it("uses the singular preset label for one preset", () => {
    const viewModel = createLandingPageViewModel([
      {
        packageName: null,
        presetCount: 1,
        slug: "single-preset-playground",
        summary: "Single summary",
        title: "Single title",
      },
    ]);

    expect(viewModel.playgrounds[0]?.presetCountLabel).toBe("1 preset");
  });
});
