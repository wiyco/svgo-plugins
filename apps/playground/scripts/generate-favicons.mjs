import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const playgroundDir = resolve(scriptDir, "..");
const publicDir = join(playgroundDir, "public");

const help = `Usage: pnpm --filter ./apps/playground generate:favicons [source-svg]

Generate the playground favicon PNG set from public/favicon.svg by default.
`;

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(help);
  process.exit(0);
}

const sourceSvgPath = args[0]
  ? resolve(process.cwd(), args[0])
  : join(publicDir, "favicon.svg");

const faviconTargets = [
  {
    outputPath: join(publicDir, "favicon-32.png"),
    size: 32,
    transparent: true,
    variant: "favicon",
  },
  {
    outputPath: join(publicDir, "favicon-48.png"),
    size: 48,
    transparent: true,
    variant: "favicon",
  },
  {
    outputPath: join(publicDir, "favicon-512.png"),
    size: 512,
    transparent: true,
    variant: "favicon",
  },
  {
    outputPath: join(publicDir, "apple-touch-icon.png"),
    size: 180,
    transparent: false,
    variant: "appIcon",
  },
  {
    outputPath: join(publicDir, "favicon-192.png"),
    size: 192,
    transparent: false,
    variant: "appIcon",
  },
  {
    outputPath: join(publicDir, "favicon-384.png"),
    size: 384,
    transparent: false,
    variant: "appIcon",
  },
  {
    outputPath: join(publicDir, "favicon-1024.png"),
    size: 1024,
    transparent: false,
    variant: "appIcon",
  },
  {
    outputPath: join(publicDir, "favicon-maskable-512.png"),
    size: 512,
    transparent: false,
    variant: "maskableIcon",
  },
  {
    outputPath: join(publicDir, "favicon-maskable-1024.png"),
    size: 1024,
    transparent: false,
    variant: "maskableIcon",
  },
];

const sourceSvg = await readFile(sourceSvgPath, "utf8");
const variants = createFaviconVariants(sourceSvg);
const browser = await chromium.launch({ args: ["--no-sandbox"] });

try {
  for (const target of faviconTargets) {
    await renderSvgToPng({
      browser,
      outputPath: target.outputPath,
      size: target.size,
      svg: variants[target.variant],
      transparent: target.transparent,
    });
    console.log(`generated ${target.outputPath}`);
  }
} finally {
  await browser.close();
}

function createFaviconVariants(sourceSvg) {
  const svgTagMatch = sourceSvg.match(/<svg\b[^>]*>/);
  const closingTagIndex = sourceSvg.lastIndexOf("</svg>");

  if (!svgTagMatch || closingTagIndex === -1) {
    throw new Error(`${sourceSvgPath} is not an SVG document.`);
  }

  const svgTag = svgTagMatch[0];
  const body = sourceSvg.slice(
    svgTagMatch.index + svgTag.length,
    closingTagIndex,
  );
  const defsMatch = body.match(/\s*<defs\b[\s\S]*?<\/defs>/);
  const bodyWithoutDefs = defsMatch ? body.replace(defsMatch[0], "") : body;
  const backgroundMatch = bodyWithoutDefs.match(
    /\s*<[^>]+fill=(["'])url\(#background\)\1[^>]*\/>/,
  );

  if (!backgroundMatch) {
    throw new Error(
      `${sourceSvgPath} must contain a self-closing background element with fill="url(#background)".`,
    );
  }

  const viewBox = parseViewBox(svgTag);
  const fill = "url(#background)";
  const logoMarkup = bodyWithoutDefs.replace(backgroundMatch[0], "").trim();
  const squareBackground = `<rect x="${formatNumber(viewBox.minX)}" y="${formatNumber(viewBox.minY)}" width="${formatNumber(viewBox.width)}" height="${formatNumber(viewBox.height)}" fill="${fill}" />`;
  const centerX = viewBox.minX + viewBox.width / 2;
  const centerY = viewBox.minY + viewBox.height / 2;
  const maskableLogo = `<g transform="translate(${formatNumber(centerX)} ${formatNumber(centerY)}) scale(0.82) translate(${formatNumber(-centerX)} ${formatNumber(-centerY)})">
${indentMarkup(logoMarkup, "    ")}
  </g>`;

  return {
    appIcon: buildSvg({
      bodyMarkup: `${squareBackground}
${indentMarkup(logoMarkup, "  ")}`,
      defsMarkup: defsMatch?.[0],
      svgTag,
    }),
    favicon: sourceSvg,
    maskableIcon: buildSvg({
      bodyMarkup: `${squareBackground}
  ${maskableLogo}`,
      defsMarkup: defsMatch?.[0],
      svgTag,
    }),
  };
}

function buildSvg({ bodyMarkup, defsMarkup, svgTag }) {
  const parts = [svgTag];

  if (defsMarkup) {
    parts.push(indentMarkup(defsMarkup.trim(), "  "));
  }

  parts.push(indentMarkup(bodyMarkup, "  "));
  parts.push("</svg>");

  return parts.join("\n");
}

async function renderSvgToPng({ browser, outputPath, size, svg, transparent }) {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { height: size, width: size },
  });

  try {
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`,
    );
    await page.screenshot({
      clip: { height: size, width: size, x: 0, y: 0 },
      omitBackground: transparent,
      path: outputPath,
    });
  } finally {
    await page.close();
  }
}

function parseViewBox(svgTag) {
  const viewBoxMatch = svgTag.match(/\bviewBox=(["'])([^"']+)\1/);

  if (!viewBoxMatch) {
    throw new Error(`${sourceSvgPath} must define viewBox.`);
  }

  const values = viewBoxMatch[2].trim().split(/\s+/).map(Number);

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${sourceSvgPath} has an invalid viewBox.`);
  }

  const [minX, minY, width, height] = values;

  return { height, minX, minY, width };
}

function indentMarkup(markup, indent) {
  return markup
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line.trimEnd()}` : line))
    .join("\n");
}

function formatNumber(value) {
  const normalizedValue = Object.is(value, -0) ? 0 : value;

  return Number.isInteger(normalizedValue)
    ? `${normalizedValue}`
    : `${Number(normalizedValue.toFixed(3))}`;
}
