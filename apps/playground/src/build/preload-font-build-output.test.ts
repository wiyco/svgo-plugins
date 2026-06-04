import { describe, expect, it } from "vitest";

import { preloadInitialFontBuildOutput } from "./preload-font-build-output";

describe("preloadInitialFontBuildOutput", () => {
  it("adds a preload for the hashed initial sans font before generated entry tags", () => {
    const rootHtml = createHtmlAsset(
      "index.html",
      [
        "<!doctype html>",
        "<html>",
        "  <head>",
        "    <title>SVGO Plugin Playground</title>",
        '    <script type="module" crossorigin src="./assets/landing.js"></script>',
        '    <link rel="stylesheet" crossorigin href="./assets/landing.css">',
        "  </head>",
        "</html>",
      ].join("\n"),
    );
    const nestedHtml = createHtmlAsset(
      "svgo-plugin-hoist-stroke-width/index.html",
      [
        "<!doctype html>",
        "<html>",
        "  <head>",
        "    <title>Hoist Stroke Width Playground</title>",
        '    <script type="module" crossorigin src="../assets/playground.js"></script>',
        '    <link rel="stylesheet" crossorigin href="../assets/playground.css">',
        "  </head>",
        "</html>",
      ].join("\n"),
    );
    const bundle = {
      "assets/not-an-asset.txt": null,
      "assets/GeistVariableLatin-test.woff2": createFontAsset(
        "assets/GeistVariableLatin-test.woff2",
      ),
      "assets/GeistMonoVariableLatin-test.woff2": createFontAsset(
        "assets/GeistMonoVariableLatin-test.woff2",
      ),
      "index.html": rootHtml,
      "svgo-plugin-hoist-stroke-width/index.html": nestedHtml,
    };

    preloadInitialFontBuildOutput(bundle);

    expect(rootHtml.source).toContain(
      '<link rel="preload" href="./assets/GeistVariableLatin-test.woff2" as="font" type="font/woff2" crossorigin>',
    );
    expect(nestedHtml.source).toContain(
      '<link rel="preload" href="../assets/GeistVariableLatin-test.woff2" as="font" type="font/woff2" crossorigin>',
    );
    expect(rootHtml.source).not.toContain("GeistMonoVariableLatin-test.woff2");
    expect(rootHtml.source.indexOf('rel="preload"')).toBeLessThan(
      rootHtml.source.indexOf('<script type="module"'),
    );
    expect(nestedHtml.source.indexOf('rel="preload"')).toBeLessThan(
      nestedHtml.source.indexOf('<script type="module"'),
    );
  });

  it("keeps the HTML unchanged when the initial sans font is not emitted", () => {
    const html = createHtmlAsset(
      "index.html",
      "<!doctype html><html><head><title>SVGO</title></head></html>",
    );
    const bundle = {
      "assets/GeistMonoVariableLatin-test.woff2": createFontAsset(
        "assets/GeistMonoVariableLatin-test.woff2",
      ),
      "index.html": html,
    };

    preloadInitialFontBuildOutput(bundle);

    expect(html.source).toBe(
      "<!doctype html><html><head><title>SVGO</title></head></html>",
    );
  });

  it("does not duplicate an existing matching preload", () => {
    const html = createHtmlAsset(
      "index.html",
      [
        "<!doctype html>",
        "<html>",
        "  <head>",
        '    <link rel="preload" href="./assets/GeistVariableLatin-test.woff2" as="font" type="font/woff2" crossorigin>',
        '    <link rel="stylesheet" crossorigin href="./assets/landing.css">',
        "  </head>",
        "</html>",
      ].join("\n"),
    );
    const bundle = {
      "assets/GeistVariableLatin-test.woff2": createFontAsset(
        "assets/GeistVariableLatin-test.woff2",
      ),
      "index.html": html,
    };

    preloadInitialFontBuildOutput(bundle);

    expect(html.source.match(/rel="preload"/g)).toHaveLength(1);
  });

  it("falls back to inserting the preload before the closing head tag", () => {
    const html = createHtmlAsset(
      "index.html",
      [
        "<!doctype html>",
        "<html>",
        "  <head>",
        "    <title>SVGO Plugin Playground</title>",
        "  </head>",
        "</html>",
      ].join("\n"),
    );
    const bundle = {
      "assets/GeistVariableLatin-test.woff2": createFontAsset(
        "assets/GeistVariableLatin-test.woff2",
      ),
      "index.html": html,
    };

    preloadInitialFontBuildOutput(bundle);

    expect(html.source).toContain(
      '    <link rel="preload" href="./assets/GeistVariableLatin-test.woff2" as="font" type="font/woff2" crossorigin>\n  </head>',
    );
  });
});

const createHtmlAsset = (fileName: string, source: string) => {
  return {
    fileName,
    source,
    type: "asset" as const,
  };
};

const createFontAsset = (fileName: string) => {
  return {
    fileName,
    source: new Uint8Array(),
    type: "asset" as const,
  };
};
