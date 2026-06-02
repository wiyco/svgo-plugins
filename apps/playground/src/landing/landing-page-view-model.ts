import type { PlaygroundCatalogEntry } from "../playgrounds/catalog-entry";

import { getPlaygroundViewTransitionNames } from "../view-transition-names";

export type LandingCatalogItemViewModel = {
  href: string;
  packageName: string | null;
  presetCountLabel: string;
  slug: string;
  slugTransitionName: string;
  summary: string;
  title: string;
  titleTransitionName: string;
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
      const transitionNames = getPlaygroundViewTransitionNames(playground.slug);

      return {
        href: `./${playground.slug}/`,
        packageName: playground.packageName,
        presetCountLabel: getPresetCountLabel(playground.presetCount),
        slug: playground.slug,
        slugTransitionName: transitionNames.slug,
        summary: playground.summary,
        title: playground.title,
        titleTransitionName: transitionNames.title,
      };
    }),
  };
};
