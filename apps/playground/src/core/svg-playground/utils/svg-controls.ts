import type { PlaygroundQueryState } from "../model";

export type SvgControls = Pick<
  PlaygroundQueryState,
  "color" | "size" | "strokeWidth"
>;

type ApplyControlsToSvgOptions = {
  preserveStrokeWidthVariations?: boolean;
};

type StyleDeclaration = {
  property: string;
  value: string;
};

const EXPANDED_HEX_COLOR_LENGTH = 7;

const getRootSvgElement = (svg: string): Element | null => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  return rootElement.tagName.toLowerCase() === "svg" ? rootElement : null;
};

const parseStyleDeclarations = (
  styleText: string | null,
): StyleDeclaration[] => {
  if (styleText === null) {
    return [];
  }

  return styleText.split(";").flatMap((segment) => {
    const separatorIndex = segment.indexOf(":");

    if (separatorIndex === -1) {
      return [];
    }

    const property = segment.slice(0, separatorIndex).trim();
    const value = segment.slice(separatorIndex + 1).trim();

    if (property.length === 0 || value.length === 0) {
      return [];
    }

    return [
      {
        property: property.toLowerCase(),
        value,
      },
    ];
  });
};

const serializeStyleDeclarations = (
  declarations: readonly StyleDeclaration[],
): string => {
  return declarations
    .map((declaration) => {
      return `${declaration.property}: ${declaration.value}`;
    })
    .join("; ");
};

const upsertStyleDeclaration = (
  styleText: string | null,
  property: string,
  value: string,
): string => {
  const normalizedProperty = property.toLowerCase();
  const nextDeclarations = parseStyleDeclarations(styleText).filter(
    (declaration) => {
      return declaration.property !== normalizedProperty;
    },
  );

  nextDeclarations.push({
    property: normalizedProperty,
    value,
  });

  return serializeStyleDeclarations(nextDeclarations);
};

const getStyleDeclarationValue = (
  styleText: string | null,
  property: string,
): string | null => {
  const normalizedProperty = property.toLowerCase();
  const match = parseStyleDeclarations(styleText)
    .reverse()
    .find((declaration) => {
      return declaration.property === normalizedProperty;
    });

  return match?.value ?? null;
};

const normalizeHexColor = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(trimmedValue)) {
    return trimmedValue.toLowerCase();
  }

  if (!/^#[0-9a-f]{3}$/i.test(trimmedValue)) {
    return null;
  }

  const normalized = trimmedValue.slice(1).toLowerCase();

  return `#${normalized
    .split("")
    .map((segment) => {
      return segment.repeat(2);
    })
    .join("")
    .slice(0, EXPANDED_HEX_COLOR_LENGTH - 1)}`;
};

const parseSvgNumber = (
  value: string | null,
  allowedUnitsPattern: RegExp,
): number | null => {
  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!allowedUnitsPattern.test(trimmedValue)) {
    return null;
  }

  const parsed = Number.parseFloat(trimmedValue);

  return Number.isFinite(parsed) ? parsed : null;
};

const parseSizeNumber = (value: string | null): number | null => {
  return parseSvgNumber(value, /^-?(?:\d+|\d*\.\d+)(?:px)?$/i);
};

const parseStrokeWidthNumber = (value: string | null): number | null => {
  return parseSvgNumber(value, /^-?(?:\d+|\d*\.\d+)$/);
};

const getStrokeWidthTargets = (rootElement: Element): Element[] => {
  const targets = rootElement.hasAttribute("stroke-width") ? [rootElement] : [];

  return [
    ...targets,
    ...Array.from(rootElement.querySelectorAll("[stroke-width]")),
  ];
};

const hasMixedStrokeWidthValues = (
  strokeWidthTargets: readonly Element[],
): boolean => {
  if (strokeWidthTargets.length <= 1) {
    return false;
  }

  const parsedStrokeWidths = strokeWidthTargets.map((target) => {
    return parseStrokeWidthNumber(target.getAttribute("stroke-width"));
  });
  const firstStrokeWidth = parsedStrokeWidths[0] ?? null;

  if (firstStrokeWidth === null) {
    return true;
  }

  return parsedStrokeWidths.some((value) => {
    return value === null || value !== firstStrokeWidth;
  });
};

export const applyControlsToSvg = (
  svg: string,
  controls: SvgControls,
  options: ApplyControlsToSvgOptions = {},
): string => {
  const rootElement = getRootSvgElement(svg);

  if (rootElement === null) {
    return svg;
  }

  rootElement.setAttribute("width", `${controls.size}`);
  rootElement.setAttribute("height", `${controls.size}`);
  rootElement.setAttribute(
    "style",
    upsertStyleDeclaration(
      rootElement.getAttribute("style"),
      "color",
      controls.color,
    ),
  );
  rootElement.removeAttribute("color");

  const strokeWidthTargets = getStrokeWidthTargets(rootElement);
  const shouldPreserveStrokeWidthVariations =
    options.preserveStrokeWidthVariations === true &&
    hasMixedStrokeWidthValues(strokeWidthTargets);

  if (shouldPreserveStrokeWidthVariations) {
    return new XMLSerializer().serializeToString(rootElement);
  }

  if (strokeWidthTargets.length === 0) {
    rootElement.setAttribute("stroke-width", `${controls.strokeWidth}`);
  } else {
    for (const target of strokeWidthTargets) {
      target.setAttribute("stroke-width", `${controls.strokeWidth}`);
    }
  }

  return new XMLSerializer().serializeToString(rootElement);
};

export const extractControlsFromSvg = (
  svg: string,
  fallbackState: SvgControls,
): SvgControls => {
  const rootElement = getRootSvgElement(svg);

  if (rootElement === null) {
    return fallbackState;
  }

  const width = parseSizeNumber(rootElement.getAttribute("width"));
  const height = parseSizeNumber(rootElement.getAttribute("height"));
  const size = width ?? height ?? fallbackState.size;
  const color =
    normalizeHexColor(
      getStyleDeclarationValue(rootElement.getAttribute("style"), "color"),
    ) ??
    normalizeHexColor(rootElement.getAttribute("color")) ??
    fallbackState.color;
  const strokeWidthTargets = getStrokeWidthTargets(rootElement);
  let strokeWidth = fallbackState.strokeWidth;

  if (strokeWidthTargets.length > 0) {
    const parsedStrokeWidths = strokeWidthTargets.map((target) => {
      return parseStrokeWidthNumber(target.getAttribute("stroke-width"));
    });
    const firstStrokeWidth = parsedStrokeWidths[0] ?? null;

    if (
      firstStrokeWidth !== null &&
      parsedStrokeWidths.every((value) => {
        return value === firstStrokeWidth;
      })
    ) {
      strokeWidth = firstStrokeWidth;
    }
  }

  return {
    color,
    size,
    strokeWidth,
  };
};
