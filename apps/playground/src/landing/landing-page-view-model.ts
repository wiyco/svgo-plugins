import type { PlaygroundCatalogEntry } from "../playgrounds/catalog-entry";

export type LandingCatalogItemViewModel = {
  href: string;
  packageName: string | null;
  presetCountLabel: string;
  slug: string;
  summary: string;
  title: string;
};

export type LandingPageViewModel = {
  playgrounds: readonly LandingCatalogItemViewModel[];
};

const getPresetCountLabel = (presetCount: number): string => {
  return `${presetCount} preset${presetCount === 1 ? "" : "s"}`;
};

export const createLandingPageViewModel = (
  catalog: readonly PlaygroundCatalogEntry[],
): LandingPageViewModel => {
  return {
    playgrounds: catalog.map((playground) => {
      return {
        href: `./${playground.slug}/`,
        packageName: playground.packageName,
        presetCountLabel: getPresetCountLabel(playground.presetCount),
        slug: playground.slug,
        summary: playground.summary,
        title: playground.title,
      };
    }),
  };
};
