import { HOIST_STROKE_WIDTH_PLAYGROUND_METADATA } from "./svgo-plugin-hoist-stroke-width/metadata";

export const PLAYGROUND_CATALOG = [HOIST_STROKE_WIDTH_PLAYGROUND_METADATA];

export const getPlaygroundPackageName = (slug: string): string | null => {
  const match = PLAYGROUND_CATALOG.find((playground) => {
    return playground.slug === slug;
  });

  return match?.packageName ?? null;
};
