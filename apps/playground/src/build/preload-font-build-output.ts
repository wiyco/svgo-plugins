type BuildOutputAsset = {
  fileName: string;
  source?: unknown;
  type: "asset";
};

const INITIAL_SANS_FONT_FILE_NAME_PATTERN =
  /^assets\/GeistVariableLatin-[^/]+\.woff2$/;
const GENERATED_ENTRY_TAG_PATTERN =
  /\n\s*(?:<script type="module"|<link rel="modulepreload"|<link rel="stylesheet")/;

export const preloadInitialFontBuildOutput = (
  bundle: Record<string, unknown>,
): void => {
  const fontFileName = findInitialSansFontFileName(bundle);

  if (fontFileName === undefined) {
    return;
  }

  for (const output of Object.values(bundle)) {
    if (!isHtmlAsset(output)) {
      continue;
    }

    output.source = preloadFontInHtml(
      output.source,
      createRelativeHref(output.fileName, fontFileName),
    );
  }
};

const findInitialSansFontFileName = (
  bundle: Record<string, unknown>,
): string | undefined => {
  for (const output of Object.values(bundle)) {
    if (!isAsset(output)) {
      continue;
    }

    if (INITIAL_SANS_FONT_FILE_NAME_PATTERN.test(output.fileName)) {
      return output.fileName;
    }
  }

  return undefined;
};

const preloadFontInHtml = (html: string, href: string): string => {
  if (
    html.includes('rel="preload"') &&
    html.includes(`href="${href}"`) &&
    html.includes('as="font"')
  ) {
    return html;
  }

  const preloadLink = `    <link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
  const generatedEntryTagMatch = html.match(GENERATED_ENTRY_TAG_PATTERN);

  if (generatedEntryTagMatch?.index !== undefined) {
    return [
      html.slice(0, generatedEntryTagMatch.index),
      "\n",
      preloadLink,
      html.slice(generatedEntryTagMatch.index),
    ].join("");
  }

  return html.replace("</head>", `${preloadLink}\n  </head>`);
};

const createRelativeHref = (
  htmlFileName: string,
  assetFileName: string,
): string => {
  const parentDirectoryDepth = htmlFileName
    .split("/")
    .slice(0, -1)
    .filter((segment) => segment.length > 0).length;

  if (parentDirectoryDepth === 0) {
    return `./${assetFileName}`;
  }

  return `${"../".repeat(parentDirectoryDepth)}${assetFileName}`;
};

const isHtmlAsset = (
  output: unknown,
): output is BuildOutputAsset & { source: string } => {
  return (
    isAsset(output) &&
    output.fileName.endsWith(".html") &&
    typeof output.source === "string"
  );
};

const isAsset = (output: unknown): output is BuildOutputAsset => {
  return (
    typeof output === "object" &&
    output !== null &&
    "fileName" in output &&
    "type" in output &&
    output.type === "asset" &&
    typeof output.fileName === "string"
  );
};
