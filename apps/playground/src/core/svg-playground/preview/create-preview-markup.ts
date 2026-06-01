type PreviewMarkupOptions = {
  ariaLabel: string;
  color: string;
  size: number;
  strokeWidth: number;
};

const getRootSvgElement = (svg: string): Element => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== "svg") {
    throw new Error("Expected optimized SVG to contain a root <svg> element.");
  }

  return rootElement;
};

const appendStyleDeclaration = (
  styleText: string | null,
  declaration: string,
): string => {
  const normalizedStyleText = styleText?.trim() ?? "";

  if (normalizedStyleText.length === 0) {
    return declaration;
  }

  return normalizedStyleText.endsWith(";")
    ? `${normalizedStyleText} ${declaration}`
    : `${normalizedStyleText}; ${declaration}`;
};

export const createPreviewMarkup = (
  optimizedSvg: string,
  { ariaLabel, color, size, strokeWidth }: PreviewMarkupOptions,
): string => {
  const rootElement = getRootSvgElement(optimizedSvg);

  rootElement.setAttribute("aria-label", ariaLabel);
  rootElement.setAttribute("height", `${size}`);
  rootElement.setAttribute("stroke-width", `${strokeWidth}`);
  rootElement.setAttribute(
    "style",
    appendStyleDeclaration(
      rootElement.getAttribute("style"),
      `color: ${color};`,
    ),
  );
  rootElement.setAttribute("width", `${size}`);

  return new XMLSerializer().serializeToString(rootElement);
};
