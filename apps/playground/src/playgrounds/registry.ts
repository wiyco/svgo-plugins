import { hoistStrokeWidthPlayground } from "./svgo-plugin-hoist-stroke-width/definition";

export const PLAYGROUNDS = [hoistStrokeWidthPlayground];

export const PLAYGROUND_PACKAGE_NAMES = {
  [hoistStrokeWidthPlayground.slug]: "@wiyco/svgo-plugin-hoist-stroke-width",
} as const;

export const getPlaygroundPackageName = (slug: string): string | null => {
  const packageName =
    PLAYGROUND_PACKAGE_NAMES[slug as keyof typeof PLAYGROUND_PACKAGE_NAMES];

  return packageName ?? null;
};
