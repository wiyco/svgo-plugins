import { describe, expect, it } from "vitest";

import { createLandingPageViewModel } from "./landing-page-view-model";

describe("landing-page-view-model", () => {
  it("builds hrefs and plural preset labels from catalog entries", () => {
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
      playgroundCountLabel: "1 playground",
      playgrounds: [
        {
          href: "./example-playground/",
          packageName: "@scope/example-playground",
          presetCountLabel: "3 presets",
          slug: "example-playground",
          summary: "Example summary",
          title: "Example title",
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
    expect(viewModel.playgroundCountLabel).toBe("1 playground");
  });

  it("uses the plural playground label for multiple playgrounds", () => {
    const viewModel = createLandingPageViewModel([
      {
        packageName: null,
        presetCount: 1,
        slug: "first-playground",
        summary: "First summary",
        title: "First title",
      },
      {
        packageName: null,
        presetCount: 1,
        slug: "second-playground",
        summary: "Second summary",
        title: "Second title",
      },
    ]);

    expect(viewModel.playgroundCountLabel).toBe("2 playgrounds");
  });
});
