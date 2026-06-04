import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRoot = {
  render: ReturnType<typeof vi.fn>;
};

const createRoot = vi.fn<(element: Element) => MockRoot>();
const flushSync = vi.fn<(callback: () => void) => void>();
const render = vi.fn<(element: unknown) => void>();
const LandingPage = () => {
  return null;
};
const App = () => {
  return null;
};

const LANDING_DESCRIPTION =
  "Explore focused SVGO plugins for SVG-to-React workflows. Paste SVG, tune presets, and compare optimized output in a live playground.";
const HOIST_STROKE_WIDTH_DESCRIPTION =
  "Try an SVGO plugin that moves uniform descendant stroke-width values to the root SVG element, making SVGR-generated React icons easier to override.";
const HOIST_STROKE_WIDTH_TITLE =
  "Hoist Stroke Width Playground | SVGO Plugin Playground";

const mockReactDomClient = () => {
  createRoot.mockReturnValue({
    render,
  });
  flushSync.mockImplementation((callback) => {
    callback();
  });
  vi.doMock("react-dom", () => {
    return {
      flushSync,
    };
  });
  vi.doMock("react-dom/client", () => {
    return {
      createRoot,
    };
  });
};

beforeEach(() => {
  document.body.innerHTML = "";
  createRoot.mockReset();
  flushSync.mockReset();
  render.mockReset();
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("react-dom");
  vi.doUnmock("react-dom/client");
  vi.doUnmock("../landing/LandingPage");
  vi.doUnmock("../playgrounds/svgo-plugin-hoist-stroke-width/App");
});

describe("playground entrypoints", () => {
  it("renders the landing entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../landing/LandingPage", () => {
      return {
        LandingPage,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./landing");

    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(flushSync).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(
      (render.mock.calls[0]?.[0] as { type: unknown } | undefined)?.type,
    ).toBe(LandingPage);
  });

  it("throws when the landing entry is missing #root", async () => {
    mockReactDomClient();
    vi.doMock("../landing/LandingPage", () => {
      return {
        LandingPage,
      };
    });

    await expect(import("./landing")).rejects.toThrow("Missing #root element");
  });

  it("renders the playground entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../playgrounds/svgo-plugin-hoist-stroke-width/App", () => {
      return {
        default: App,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./svgo-plugin-hoist-stroke-width");

    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(flushSync).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(
      (render.mock.calls[0]?.[0] as { type: unknown } | undefined)?.type,
    ).toBe(App);
  });

  it("throws when the playground entry is missing #root", async () => {
    mockReactDomClient();
    vi.doMock("../playgrounds/svgo-plugin-hoist-stroke-width/App", () => {
      return {
        default: App,
      };
    });

    await expect(import("./svgo-plugin-hoist-stroke-width")).rejects.toThrow(
      "Missing #root element",
    );
  });

  it("keeps both entry stylesheets on the shared token layer", async () => {
    const [tokensCss, landingCss, playgroundCss] = await Promise.all([
      readFile(
        resolve(process.cwd(), "apps/playground/src/tokens.css"),
        "utf8",
      ),
      readFile(
        resolve(process.cwd(), "apps/playground/src/landing/index.css"),
        "utf8",
      ),
      readFile(resolve(process.cwd(), "apps/playground/src/index.css"), "utf8"),
    ]);

    expect(landingCss).toContain('@import "../tokens.css";');
    expect(playgroundCss).toContain('@import "./tokens.css";');
    expect(tokensCss).toContain("scrollbar-gutter: stable;");
    expect(landingCss).toContain("width: min(980px, calc(100% - 24px));");
    expect(landingCss).toContain("width: min(calc(100% - 16px), 980px);");
    expect(playgroundCss).toContain("width: min(1440px, calc(100% - 24px));");
    expect(playgroundCss).toContain("width: min(calc(100% - 16px), 1440px);");
    expect(landingCss).not.toContain("@view-transition");
    expect(playgroundCss).not.toContain("@view-transition");
    expect(landingCss).not.toContain("::view-transition");
    expect(playgroundCss).not.toContain("::view-transition");
    expect(landingCss).not.toContain("navigation: auto;");
    expect(playgroundCss).not.toContain("navigation: auto;");
    expect(landingCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(playgroundCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(landingCss).toContain("transition:");
    expect(playgroundCss).toContain("transition:");
    expect(playgroundCss).toContain(".ripple-surface");
    expect(playgroundCss).toContain("@keyframes button-ripple");
    expect(playgroundCss).toContain(".visually-hidden");
    expect(playgroundCss).toContain("inline-size var(--duration-medium)");
    expect(playgroundCss).toContain(".size-slider::-webkit-slider-thumb");
    expect(playgroundCss).toContain(".size-slider::-moz-range-thumb");
    expect(playgroundCss).not.toContain(
      '.share-button[data-share-feedback-state="success"] .share-button-icon-wrap',
    );
    expect(playgroundCss).not.toContain(
      '.share-button[data-share-feedback-state="failed"] .share-button-icon-wrap',
    );
    expect(landingCss).not.toContain("animation: none");
    expect(playgroundCss).not.toContain("animation: none");
    expect(landingCss).toContain("translateY(-1px)");
    expect(playgroundCss).not.toContain("translateY(-1px)");
  });

  it("keeps favicon links and social metadata available for landing and playground pages", async () => {
    const [landingHtml, playgroundHtml, siteManifestJson] = await Promise.all([
      readFile(resolve(process.cwd(), "apps/playground/index.html"), "utf8"),
      readFile(
        resolve(
          process.cwd(),
          "apps/playground/svgo-plugin-hoist-stroke-width/index.html",
        ),
        "utf8",
      ),
      readFile(
        resolve(process.cwd(), "apps/playground/public/site.webmanifest"),
        "utf8",
      ),
    ]);
    const siteManifest = JSON.parse(siteManifestJson) as {
      background_color: string;
      description: string;
      display: string;
      icons: Array<{
        purpose: string;
        sizes: string;
        src: string;
        type: string;
      }>;
      id: string;
      name: string;
      scope: string;
      short_name: string;
      start_url: string;
      theme_color: string;
    };

    const landingDocument = new DOMParser().parseFromString(
      landingHtml,
      "text/html",
    );
    const playgroundDocument = new DOMParser().parseFromString(
      playgroundHtml,
      "text/html",
    );
    const expectElementAttributes = (
      pageDocument: Document,
      selector: string,
      attributes: Record<string, string>,
    ): void => {
      const element = pageDocument.querySelector(selector);

      expect(element).not.toBeNull();
      Object.entries(attributes).forEach(([name, value]) => {
        expect(element?.getAttribute(name)).toBe(value);
      });
    };
    const expectFaviconMetadata = (
      pageDocument: Document,
      assetPrefix: string,
    ): void => {
      expectElementAttributes(
        pageDocument,
        'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
        {
          content: "#edf6ff",
        },
      );
      expectElementAttributes(
        pageDocument,
        'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
        {
          content: "#05070a",
        },
      );
      expectElementAttributes(
        pageDocument,
        'link[rel="icon"][type="image/png"][sizes="32x32"]',
        {
          href: `${assetPrefix}favicon-32.png`,
        },
      );
      expectElementAttributes(
        pageDocument,
        'link[rel="icon"][type="image/png"][sizes="48x48"]',
        {
          href: `${assetPrefix}favicon-48.png`,
        },
      );
      expectElementAttributes(
        pageDocument,
        'link[rel="icon"][type="image/png"][sizes="512x512"]',
        {
          href: `${assetPrefix}favicon-512.png`,
        },
      );
      expectElementAttributes(
        pageDocument,
        'link[rel="icon"][type="image/svg+xml"]',
        {
          href: `${assetPrefix}favicon.svg`,
          sizes: "any",
        },
      );
      expectElementAttributes(pageDocument, 'link[rel="apple-touch-icon"]', {
        href: `${assetPrefix}apple-touch-icon.png`,
        sizes: "180x180",
      });
      expectElementAttributes(pageDocument, 'link[rel="manifest"]', {
        href: `${assetPrefix}site.webmanifest`,
      });
    };

    expect(landingDocument.querySelector("title")?.textContent).toBe(
      "SVGO Plugin Playground",
    );
    expect(playgroundDocument.querySelector("title")?.textContent).toBe(
      HOIST_STROKE_WIDTH_TITLE,
    );

    expectElementAttributes(landingDocument, 'meta[name="description"]', {
      content: LANDING_DESCRIPTION,
    });
    expectElementAttributes(landingDocument, 'meta[property="og:type"]', {
      content: "website",
    });
    expectElementAttributes(landingDocument, 'meta[property="og:title"]', {
      content: "SVGO Plugin Playground",
    });
    expectElementAttributes(
      landingDocument,
      'meta[property="og:description"]',
      {
        content: LANDING_DESCRIPTION,
      },
    );
    expectElementAttributes(landingDocument, 'meta[property="og:image"]', {
      content: "./og-image.png",
    });
    expectElementAttributes(
      landingDocument,
      'meta[property="og:image:width"]',
      {
        content: "1200",
      },
    );
    expectElementAttributes(
      landingDocument,
      'meta[property="og:image:height"]',
      {
        content: "630",
      },
    );
    expectElementAttributes(landingDocument, 'meta[property="og:image:type"]', {
      content: "image/png",
    });
    expectElementAttributes(landingDocument, 'meta[name="twitter:card"]', {
      content: "summary_large_image",
    });
    expectElementAttributes(landingDocument, 'meta[name="twitter:title"]', {
      content: "SVGO Plugin Playground",
    });
    expectElementAttributes(
      landingDocument,
      'meta[name="twitter:description"]',
      {
        content: LANDING_DESCRIPTION,
      },
    );
    expectElementAttributes(landingDocument, 'meta[name="twitter:image"]', {
      content: "./og-image.png",
    });
    expectFaviconMetadata(landingDocument, "./");

    expectElementAttributes(playgroundDocument, 'meta[name="description"]', {
      content: HOIST_STROKE_WIDTH_DESCRIPTION,
    });
    expectElementAttributes(playgroundDocument, 'meta[property="og:type"]', {
      content: "website",
    });
    expectElementAttributes(playgroundDocument, 'meta[property="og:title"]', {
      content: HOIST_STROKE_WIDTH_TITLE,
    });
    expectElementAttributes(
      playgroundDocument,
      'meta[property="og:description"]',
      {
        content: HOIST_STROKE_WIDTH_DESCRIPTION,
      },
    );
    expectElementAttributes(playgroundDocument, 'meta[property="og:image"]', {
      content: "./og-image.png",
    });
    expectElementAttributes(
      playgroundDocument,
      'meta[property="og:image:width"]',
      {
        content: "1200",
      },
    );
    expectElementAttributes(
      playgroundDocument,
      'meta[property="og:image:height"]',
      {
        content: "630",
      },
    );
    expectElementAttributes(
      playgroundDocument,
      'meta[property="og:image:type"]',
      {
        content: "image/png",
      },
    );
    expectElementAttributes(playgroundDocument, 'meta[name="twitter:card"]', {
      content: "summary_large_image",
    });
    expectElementAttributes(playgroundDocument, 'meta[name="twitter:title"]', {
      content: HOIST_STROKE_WIDTH_TITLE,
    });
    expectElementAttributes(
      playgroundDocument,
      'meta[name="twitter:description"]',
      {
        content: HOIST_STROKE_WIDTH_DESCRIPTION,
      },
    );
    expectElementAttributes(playgroundDocument, 'meta[name="twitter:image"]', {
      content: "./og-image.png",
    });
    expectFaviconMetadata(playgroundDocument, "../");

    expect(siteManifest).toMatchObject({
      background_color: "#edf6ff",
      description: "Explore focused SVGO plugins for SVG-to-React workflows.",
      display: "browser",
      id: "./",
      name: "SVGO Plugin Playground",
      scope: "./",
      short_name: "SVGO",
      start_url: "./",
      theme_color: "#edf6ff",
    });
    expect(siteManifest.icons).toEqual([
      {
        purpose: "any",
        sizes: "any",
        src: "./favicon.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "any",
        sizes: "192x192",
        src: "./favicon-192.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "384x384",
        src: "./favicon-384.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "./favicon-512.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "1024x1024",
        src: "./favicon-1024.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "./favicon-maskable-512.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "1024x1024",
        src: "./favicon-maskable-1024.png",
        type: "image/png",
      },
    ]);
  });

  it("keeps OpenGraph image assets at the expected dimensions", async () => {
    const assetPaths = [
      "apps/playground/public/og-image",
      "apps/playground/public/svgo-plugin-hoist-stroke-width/og-image",
    ] as const;
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    await Promise.all(
      assetPaths.map(async (assetPath) => {
        const [svg, png] = await Promise.all([
          readFile(resolve(process.cwd(), `${assetPath}.svg`), "utf8"),
          readFile(resolve(process.cwd(), `${assetPath}.png`)),
        ]);

        expect(svg).toContain('width="1200" height="630"');
        expect(png.subarray(0, 8)).toEqual(pngSignature);
        expect(png.readUInt32BE(16)).toBe(1200);
        expect(png.readUInt32BE(20)).toBe(630);
      }),
    );
  });

  it("keeps favicon image assets at the expected dimensions", async () => {
    const pngAssets = [
      ["apps/playground/public/favicon-32.png", 32],
      ["apps/playground/public/favicon-48.png", 48],
      ["apps/playground/public/apple-touch-icon.png", 180],
      ["apps/playground/public/favicon-192.png", 192],
      ["apps/playground/public/favicon-384.png", 384],
      ["apps/playground/public/favicon-512.png", 512],
      ["apps/playground/public/favicon-1024.png", 1024],
      ["apps/playground/public/favicon-maskable-512.png", 512],
      ["apps/playground/public/favicon-maskable-1024.png", 1024],
    ] as const;
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    await Promise.all(
      pngAssets.map(async ([assetPath, size]) => {
        const png = await readFile(resolve(process.cwd(), assetPath));

        expect(png.subarray(0, 8)).toEqual(pngSignature);
        expect(png.readUInt32BE(16)).toBe(size);
        expect(png.readUInt32BE(20)).toBe(size);
      }),
    );
  });
});
