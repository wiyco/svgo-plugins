import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const createPlaygroundPackageSourceAliases = (configFileUrl, slugs) => {
  const appDir = dirname(fileURLToPath(configFileUrl));

  return Object.fromEntries(
    slugs.map((slug) => {
      return [
        `@wiyco/${slug}`,
        resolve(appDir, `../../packages/${slug}/src/index.ts`),
      ];
    }),
  );
};
