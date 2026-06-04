import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const playgroundDir = resolve(scriptDir, "..");
const publicDir = join(playgroundDir, "public");
const fontsDir = join(playgroundDir, "src", "assets", "fonts");

const help = `Usage: pnpm --filter ./apps/playground generate:og-images [svg ...]

Convert the playground OpenGraph SVG assets to PNG. Without arguments, this
updates public/og-image.png and public/svgo-plugin-hoist-stroke-width/og-image.png.
`;

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(help);
  process.exit(0);
}

const sourceSvgPaths =
  args.length > 0
    ? args.map((arg) => resolve(process.cwd(), arg))
    : [
        join(publicDir, "og-image.svg"),
        join(publicDir, "svgo-plugin-hoist-stroke-width", "og-image.svg"),
      ];

const fontFaceStyles = await createFontFaceStyles();
const browser = await chromium.launch({ args: ["--no-sandbox"] });

try {
  for (const sourceSvgPath of sourceSvgPaths) {
    const svg = await readFile(sourceSvgPath, "utf8");
    const dimensions = parseSvgDimensions(svg, sourceSvgPath);
    const outputPath = sourceSvgPath.replace(
      new RegExp(`${escapeRegExp(extname(sourceSvgPath))}$`),
      ".png",
    );

    await renderSvgToPng({
      browser,
      dimensions,
      fontFaceStyles,
      outputPath,
      svg,
    });
    console.log(`generated ${outputPath}`);
  }
} finally {
  await browser.close();
}

async function renderSvgToPng({
  browser,
  dimensions,
  fontFaceStyles,
  outputPath,
  svg,
}) {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: {
      height: dimensions.height,
      width: dimensions.width,
    },
  });

  try {
    await page.setContent(
      `<!doctype html><html><head><style>${fontFaceStyles}html,body{margin:0;width:${dimensions.width}px;height:${dimensions.height}px;overflow:hidden;background:transparent}svg{display:block;width:${dimensions.width}px;height:${dimensions.height}px}</style></head><body>${svg}</body></html>`,
    );
    // oxlint-disable-next-line no-undef
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      clip: { height: dimensions.height, width: dimensions.width, x: 0, y: 0 },
      omitBackground: false,
      path: outputPath,
    });
  } finally {
    await page.close();
  }
}

async function createFontFaceStyles() {
  const [geistSans, geistMono] = await Promise.all([
    readFontDataUrl(join(fontsDir, "GeistVariableLatin.woff2")),
    readFontDataUrl(join(fontsDir, "GeistMonoVariableLatin.woff2")),
  ]);

  return [
    createFontFace("Geist", geistSans),
    createFontFace("Geist Variable Fallback", geistSans),
    createFontFace("Geist Mono", geistMono),
    createFontFace("Geist Mono Variable Fallback", geistMono),
  ].join("");
}

async function readFontDataUrl(fontPath) {
  const fontBuffer = await readFile(fontPath);

  return `data:font/woff2;base64,${fontBuffer.toString("base64")}`;
}

function createFontFace(fontFamily, fontDataUrl) {
  return `@font-face{font-family:"${fontFamily}";font-style:normal;font-weight:100 900;font-display:block;src:url("${fontDataUrl}") format("woff2");}`;
}

function parseSvgDimensions(svg, sourceSvgPath) {
  const svgTagMatch = svg.match(/<svg\b[^>]*>/);

  if (!svgTagMatch) {
    throw new Error(`${sourceSvgPath} is not an SVG document.`);
  }

  const svgTag = svgTagMatch[0];
  const width = parseDimension(svgTag, "width", sourceSvgPath);
  const height = parseDimension(svgTag, "height", sourceSvgPath);

  return { height, width };
}

function parseDimension(svgTag, attributeName, sourceSvgPath) {
  const dimensionMatch = svgTag.match(
    new RegExp(`\\b${attributeName}=(["'])([^"']+)\\1`),
  );

  if (!dimensionMatch) {
    throw new Error(`${sourceSvgPath} must define ${attributeName}.`);
  }

  const dimension = Number(dimensionMatch[2]);

  if (
    !Number.isFinite(dimension) ||
    !Number.isInteger(dimension) ||
    dimension <= 0
  ) {
    throw new Error(`${sourceSvgPath} has an invalid ${attributeName}.`);
  }

  return dimension;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
