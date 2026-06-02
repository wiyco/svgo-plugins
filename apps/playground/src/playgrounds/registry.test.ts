import { readFile } from "fs/promises";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

import { getUnsafeSvgReason } from "../core/svg-playground/transform/unsafe-svg";
import { PLAYGROUND_CATALOG } from "./catalog";
import { PLAYGROUNDS, getPlaygroundPackageName } from "./registry";

describe("playground registry", () => {
  it("keeps the visible package name in sync with the package manifest", async () => {
    const packageJson = JSON.parse(
      await readFile(
        resolve(
          process.cwd(),
          "packages/svgo-plugin-hoist-stroke-width/package.json",
        ),
        "utf8",
      ),
    ) as { name: string };
    const playground = PLAYGROUNDS[0];

    if (playground === undefined) {
      throw new Error("Expected at least one registered playground");
    }

    expect(getPlaygroundPackageName(playground.slug)).toBe(packageJson.name);
  });

  it("returns null for unknown playground slugs", () => {
    expect(getPlaygroundPackageName("missing-playground")).toBeNull();
  });

  it("keeps landing preset counts in sync with visible safe presets", () => {
    const mismatchedCatalogEntries = PLAYGROUND_CATALOG.filter(
      (catalogEntry) => {
        const playground = PLAYGROUNDS.find((candidate) => {
          return candidate.slug === catalogEntry.slug;
        });

        if (playground === undefined) {
          return true;
        }

        const visiblePresetCount = playground.presets.filter((preset) => {
          return getUnsafeSvgReason(preset.svg) === null;
        }).length;

        return visiblePresetCount !== catalogEntry.presetCount;
      },
    );

    expect(mismatchedCatalogEntries).toEqual([]);
  });
});
