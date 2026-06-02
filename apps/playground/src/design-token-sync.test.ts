import { readFile } from "fs/promises";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

type TokenBranch = {
  [key: string]: TokenBranch | string;
};

const DESIGN_PATH = resolve(process.cwd(), "apps/playground/DESIGN.md");
const TOKENS_PATH = resolve(process.cwd(), "apps/playground/src/tokens.css");

const normalizeValue = (value: string): string => {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/(\d+\.\d*?[1-9])0+\b/g, "$1")
    .replace(/(\d+)\.0+\b/g, "$1")
    .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, "#$1$2$3")
    .trim()
    .toLowerCase();
};

const parseScalar = (value: string): string => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  throw new Error(`Unsupported scalar value: ${value}`);
};

const parseDesignFrontmatter = (source: string): TokenBranch => {
  const match = /^---\n([\s\S]*?)\n---/m.exec(source);

  if (match === null) {
    throw new Error("Missing DESIGN.md frontmatter");
  }

  const frontmatterSource = match[1];

  if (frontmatterSource === undefined) {
    throw new Error("Missing DESIGN.md frontmatter body");
  }

  const root: TokenBranch = {};
  const stack: Array<{ indent: number; branch: TokenBranch }> = [
    { branch: root, indent: -1 },
  ];

  for (const line of frontmatterSource.split("\n")) {
    if (line.trim() === "") {
      continue;
    }

    const entry = /^(\s*)([^:]+):(.*)$/.exec(line);

    if (entry === null) {
      throw new Error(`Unsupported frontmatter line: ${line}`);
    }

    const indentSource = entry[1];
    const keySource = entry[2];
    const valueSource = entry[3];

    if (
      indentSource === undefined ||
      keySource === undefined ||
      valueSource === undefined
    ) {
      throw new Error(`Incomplete frontmatter line: ${line}`);
    }

    const indent = indentSource.length;
    const key = keySource.trim();
    const value = valueSource.trim();

    // oxlint-disable-next-line typescript/no-non-null-assertion
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    // oxlint-disable-next-line typescript/no-non-null-assertion
    const current = stack[stack.length - 1]!.branch;

    if (value === "") {
      const branch: TokenBranch = {};
      current[key] = branch;
      stack.push({ branch, indent });
      continue;
    }

    current[key] = parseScalar(value);
  }

  return root;
};

const flattenTokens = (branch: TokenBranch): Record<string, string> => {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(branch)) {
    if (typeof value !== "string") {
      throw new Error(`Expected token leaf at "${key}"`);
    }

    entries.push([key, normalizeValue(value)]);
  }

  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
};

const extractCssBlock = (source: string, pattern: RegExp): string => {
  const match = pattern.exec(source);

  if (match === null) {
    throw new Error(`Missing CSS block for ${pattern}`);
  }

  const openBraceIndex = source.indexOf("{", match.index);

  if (openBraceIndex === -1) {
    throw new Error(`Missing block opener for ${pattern}`);
  }

  let depth = 0;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const character = source[index];

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openBraceIndex + 1, index);
      }
    }
  }

  throw new Error(`Unterminated CSS block for ${pattern}`);
};

const parseCssCustomProperties = (block: string): Record<string, string> => {
  const entries = [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(
    (match) => {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      return [match[1]!, normalizeValue(match[2]!)] as const;
    },
  );

  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
};

const readTokenSources = async () => {
  const [designSource, cssSource] = await Promise.all([
    readFile(DESIGN_PATH, "utf8"),
    readFile(TOKENS_PATH, "utf8"),
  ]);
  const design = parseDesignFrontmatter(designSource);

  const primitives = design.primitives;
  const typography = design.typography;
  const spacing = design.spacing;
  const radii = design.radii;
  const effects = design.effects;
  const motion = design.motion;
  const components = design.components;
  const themes = design.themes;

  if (
    primitives === undefined ||
    typography === undefined ||
    spacing === undefined ||
    radii === undefined ||
    effects === undefined ||
    motion === undefined ||
    components === undefined ||
    themes === undefined ||
    typeof primitives === "string" ||
    typeof typography === "string" ||
    typeof spacing === "string" ||
    typeof radii === "string" ||
    typeof effects === "string" ||
    typeof motion === "string" ||
    typeof components === "string" ||
    typeof themes === "string"
  ) {
    throw new Error("DESIGN.md token groups are incomplete");
  }

  const light = themes.light;
  const dark = themes.dark;

  if (
    light === undefined ||
    dark === undefined ||
    typeof light === "string" ||
    typeof dark === "string"
  ) {
    throw new Error("DESIGN.md must define light and dark theme token groups");
  }

  return {
    cssDark: parseCssCustomProperties(
      extractCssBlock(cssSource, /^:root\[data-theme="dark"\]\s*\{/m),
    ),
    cssLight: parseCssCustomProperties(
      extractCssBlock(cssSource, /^:root,\s*:root\[data-theme="light"\]\s*\{/m),
    ),
    cssRoot: parseCssCustomProperties(
      extractCssBlock(cssSource, /^:root\s*\{/m),
    ),
    expectedDark: flattenTokens(dark),
    expectedLight: flattenTokens(light),
    expectedRoot: flattenTokens({
      ...primitives,
      ...typography,
      ...spacing,
      ...radii,
      ...effects,
      ...motion,
      ...components,
    }),
  };
};

describe("playground design tokens", () => {
  it("keeps DESIGN.md and tokens.css in sync", async () => {
    const {
      cssDark,
      cssLight,
      cssRoot,
      expectedDark,
      expectedLight,
      expectedRoot,
    } = await readTokenSources();

    expect(cssRoot).toEqual(expectedRoot);
    expect(cssLight).toEqual(expectedLight);
    expect(cssDark).toEqual(expectedDark);
  });

  it("aligns unavailable sharing feedback with the copied/info color family", async () => {
    const { expectedLight, expectedDark } = await readTokenSources();

    expect(expectedLight["component-share-button-unavailable-background"]).toBe(
      expectedLight["component-share-button-success-background"],
    );
    expect(expectedLight["component-share-button-unavailable-color"]).toBe(
      expectedLight["component-share-button-success-color"],
    );
    expect(expectedDark["component-share-button-unavailable-background"]).toBe(
      expectedDark["component-share-button-success-background"],
    );
    expect(expectedDark["component-share-button-unavailable-color"]).toBe(
      expectedDark["component-share-button-success-color"],
    );
    expect(
      expectedLight["component-share-button-unavailable-background"],
    ).not.toBe(expectedLight["component-share-button-failed-background"]);
  });
});
