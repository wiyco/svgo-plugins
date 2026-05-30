import type { CustomPlugin, XastChild, XastElement } from "svgo";

const DEFAULT_STROKE_WIDTH = "1";
const GRAPHIC_ELEMENT_NAMES = new Set([
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "textPath",
  "tspan",
]);
const STROKE_RELATED_STYLE_PATTERN = /(?:^|;)\s*stroke(?:-width)?\s*:/;

type StrokeContext = {
  stroke: string | null;
  strokeWidth: string | null;
};

type StrokeWidthAnalysis = {
  hasComplexStrokeStyling: boolean;
  normalizedCandidateToRaw: Map<string, string>;
  strokedElementWidths: string[];
};

const isElement = (node: XastChild): node is XastElement => {
  return node.type === "element";
};

const normalizeStrokeWidthValue = (value: string): string => {
  const trimmedValue = value.trim();

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmedValue)) {
    return String(Number(trimmedValue));
  }

  return trimmedValue;
};

const getOnlyEntry = <K, V>(map: ReadonlyMap<K, V>): [K, V] | null => {
  let entry: [K, V] | null = null;

  for (const candidate of map) {
    if (entry !== null) {
      return null;
    }

    entry = candidate;
  }

  return entry;
};

const analyzeStrokeWidth = (svg: XastElement): StrokeWidthAnalysis => {
  const normalizedCandidateToRaw = new Map<string, string>();
  const strokedElementWidths: string[] = [];
  let hasComplexStrokeStyling = false;

  const visit = (node: XastElement, context: StrokeContext): void => {
    if (hasComplexStrokeStyling) {
      return;
    }

    const style = node.attributes.style;

    if (style !== undefined && STROKE_RELATED_STYLE_PATTERN.test(style)) {
      hasComplexStrokeStyling = true;
      return;
    }

    const currentStroke = node.attributes.stroke ?? context.stroke;
    const ownStrokeWidth = node.attributes["stroke-width"];
    const currentStrokeWidth = ownStrokeWidth ?? context.strokeWidth;

    if (node !== svg && ownStrokeWidth !== undefined) {
      const normalizedStrokeWidth = normalizeStrokeWidthValue(ownStrokeWidth);

      normalizedCandidateToRaw.set(
        normalizedStrokeWidth,
        normalizedCandidateToRaw.get(normalizedStrokeWidth) ?? ownStrokeWidth,
      );
    }

    if (
      node !== svg &&
      GRAPHIC_ELEMENT_NAMES.has(node.name) &&
      currentStroke !== null &&
      currentStroke !== "none"
    ) {
      strokedElementWidths.push(
        normalizeStrokeWidthValue(currentStrokeWidth ?? DEFAULT_STROKE_WIDTH),
      );
    }

    for (const child of node.children) {
      if (!isElement(child)) {
        continue;
      }

      visit(child, {
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
      });
    }
  };

  visit(svg, {
    stroke: null,
    strokeWidth: null,
  });

  return {
    hasComplexStrokeStyling,
    normalizedCandidateToRaw,
    strokedElementWidths,
  };
};

const removeDescendantStrokeWidth = (
  node: XastElement,
  normalizedStrokeWidth: string,
): void => {
  for (const child of node.children) {
    if (!isElement(child)) {
      continue;
    }

    const childStrokeWidth = child.attributes["stroke-width"];

    if (
      childStrokeWidth !== undefined &&
      normalizeStrokeWidthValue(childStrokeWidth) === normalizedStrokeWidth
    ) {
      delete child.attributes["stroke-width"];
    }

    removeDescendantStrokeWidth(child, normalizedStrokeWidth);
  }
};

export const hoistStrokeWidthToSvgRoot = (svg: XastElement): boolean => {
  if (svg.name !== "svg") {
    return false;
  }

  const {
    hasComplexStrokeStyling,
    normalizedCandidateToRaw,
    strokedElementWidths,
  } = analyzeStrokeWidth(svg);

  if (hasComplexStrokeStyling) {
    return false;
  }

  if (strokedElementWidths.length === 0) {
    return false;
  }

  const strokeWidthEntry = getOnlyEntry(normalizedCandidateToRaw);

  if (strokeWidthEntry === null) {
    return false;
  }

  const [normalizedStrokeWidth, rawStrokeWidth] = strokeWidthEntry;

  if (
    strokedElementWidths.some((strokeWidth) => {
      return strokeWidth !== normalizedStrokeWidth;
    })
  ) {
    return false;
  }

  if (
    svg.attributes["stroke-width"] !== undefined &&
    normalizeStrokeWidthValue(svg.attributes["stroke-width"]) !==
      normalizedStrokeWidth
  ) {
    return false;
  }

  svg.attributes["stroke-width"] ??= rawStrokeWidth;
  removeDescendantStrokeWidth(svg, normalizedStrokeWidth);

  return true;
};

export const createHoistStrokeWidthPlugin = (): CustomPlugin => {
  return {
    name: "hoist-stroke-width",
    fn: () => {
      return {
        element: {
          enter: (node) => {
            if (node.name !== "svg") {
              return;
            }

            hoistStrokeWidthToSvgRoot(node);
          },
        },
      };
    },
  };
};
