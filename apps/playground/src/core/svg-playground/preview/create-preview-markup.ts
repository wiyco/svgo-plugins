type PreviewMarkupOptions = {
  ariaLabel: string;
};

const getRootSvgElement = (svg: string): Element => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== "svg") {
    throw new Error("Expected optimized SVG to contain a root <svg> element.");
  }

  return rootElement;
};

export const createPreviewMarkup = (
  optimizedSvg: string,
  options: PreviewMarkupOptions,
): string => {
  const { ariaLabel } = options;

  const rootElement = getRootSvgElement(optimizedSvg);

  rootElement.setAttribute("aria-label", ariaLabel);

  return new XMLSerializer().serializeToString(rootElement);
};
