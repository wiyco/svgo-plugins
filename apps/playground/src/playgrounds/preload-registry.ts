import playgroundStylesheetHref from "../index.css?url";
import { PLAYGROUNDS } from "./registry";

type PlaygroundWarmupDefinition = {
  modulePreloadHrefs?: readonly string[];
  preload?: () => Promise<void>;
  stylesheetHref?: string;
};

type WarmupLinkOptions = {
  href: string;
  kind: string;
  rel: string;
  slug: string;
};

const playgroundWarmupDefinitions: Record<string, PlaygroundWarmupDefinition> =
  {
    "svgo-plugin-hoist-stroke-width": {
      modulePreloadHrefs: [
        new URL(
          "./svgo-plugin-hoist-stroke-width/svg-transform.worker.ts",
          import.meta.url,
        ).href,
      ],
      preload: async () => {
        await import("./svgo-plugin-hoist-stroke-width/App");
      },
      stylesheetHref: playgroundStylesheetHref,
    },
  };

const warmupPromises = new Map<string, Promise<void>>();

const ensureWarmupLink = (options: WarmupLinkOptions): HTMLLinkElement => {
  const { href, kind, rel, slug } = options;
  const selector = [
    `link[data-playground-warmup="${slug}"]`,
    `[data-warmup-kind="${kind}"]`,
  ].join("");
  const existingLink = document.head.querySelector<HTMLLinkElement>(selector);

  if (existingLink !== null) {
    return existingLink;
  }

  const link = document.createElement("link");

  link.rel = rel;
  link.href = href;
  link.dataset.playgroundWarmup = slug;
  link.dataset.warmupKind = kind;

  if (rel === "modulepreload") {
    link.crossOrigin = "";
  }

  document.head.append(link);

  return link;
};

const ensurePlaygroundDocumentPrefetch = (slug: string): void => {
  ensureWarmupLink({
    href: new URL(`${slug}/`, window.location.href).toString(),
    kind: "document",
    rel: "prefetch",
    slug,
  });
};

const ensurePlaygroundAssetWarmupLinks = (slug: string): void => {
  const definition = playgroundWarmupDefinitions[slug];

  if (definition?.stylesheetHref !== undefined) {
    ensureWarmupLink({
      href: definition.stylesheetHref,
      kind: "style",
      rel: "prefetch",
      slug,
    });
  }

  definition?.modulePreloadHrefs?.forEach((href, index) => {
    ensureWarmupLink({
      href,
      kind: `module-${index}`,
      rel: "modulepreload",
      slug,
    });
  });
};

export const warmPlaygroundRoute = async (slug: string): Promise<void> => {
  ensurePlaygroundDocumentPrefetch(slug);
  ensurePlaygroundAssetWarmupLinks(slug);

  const existingPromise = warmupPromises.get(slug);

  if (existingPromise !== undefined) {
    await existingPromise;
    return;
  }

  const warmupPromise =
    playgroundWarmupDefinitions[slug]?.preload?.().catch(() => undefined) ??
    Promise.resolve();

  warmupPromises.set(slug, warmupPromise);
  await warmupPromise;
};

export const warmPlaygroundRoutes = async (
  slugs: readonly string[],
): Promise<void> => {
  await Promise.all(
    Array.from(new Set(slugs)).map((slug) => {
      return warmPlaygroundRoute(slug);
    }),
  );
};

export const schedulePlaygroundWarmup = (
  slugs: readonly string[] = PLAYGROUNDS.map(({ slug }) => slug),
): void => {
  const runWarmup = () => {
    void warmPlaygroundRoutes(slugs);
  };
  const requestIdleCallback = window.requestIdleCallback;

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(runWarmup, {
      timeout: 250,
    });
    return;
  }

  window.setTimeout(runWarmup, 0);
};
