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
  playgroundCountLabel: string;
  playgrounds: readonly LandingCatalogItemViewModel[];
};

const getPresetCountLabel = (presetCount: number): string => {
  return `${presetCount} preset${presetCount === 1 ? "" : "s"}`;
};

const getPlaygroundCountLabel = (playgroundCount: number): string => {
  return `${playgroundCount} playground${playgroundCount === 1 ? "" : "s"}`;
};

export const createLandingPageViewModel = (
  catalog: readonly PlaygroundCatalogEntry[],
): LandingPageViewModel => {
  return {
    playgroundCountLabel: getPlaygroundCountLabel(catalog.length),
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
