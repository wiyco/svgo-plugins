const SCRIPT_ELEMENT_REASON =
  "Script elements are blocked in the playground preview.";
const FOREIGN_OBJECT_REASON =
  "Embedded HTML via <foreignObject> is blocked in the playground preview.";
const STYLE_ELEMENT_REASON =
  "Style elements are blocked in the playground preview.";
const INLINE_EVENT_HANDLER_REASON =
  "Inline event handlers are blocked in the playground preview.";
const JAVASCRIPT_URL_REASON =
  "javascript: URLs are blocked in the playground preview.";
const HTML_DATA_URL_REASON =
  "HTML data URLs are blocked in the playground preview.";
const DATA_URL_REASON = "Data URLs are blocked in the playground preview.";
const REMOTE_URL_REASON = "Remote URLs are blocked in the playground preview.";
const NON_FRAGMENT_URL_REASON =
  "Only fragment-only URLs are allowed in the playground preview.";

const BLOCKED_ELEMENT_REASONS = {
  foreignobject: FOREIGN_OBJECT_REASON,
  script: SCRIPT_ELEMENT_REASON,
  style: STYLE_ELEMENT_REASON,
} as const;

const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/giu;
const EVENT_HANDLER_ATTRIBUTE_PATTERN = /^on/i;
const REFERENCE_ATTRIBUTE_NAMES = new Set(["href", "src", "xlink:href"]);

const extractCssUrlValue = (cssUrlExpression: string): string => {
  return cssUrlExpression
    .replace(/^url\(\s*/iu, "")
    .replace(/\s*\)$/u, "")
    .replace(/^(['"])(.*)\1$/u, "$2");
};

const getRootSvgElement = (svg: string): Element | null => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  return rootElement.tagName.toLowerCase() === "svg" ? rootElement : null;
};

const getUnsafeReferenceReason = (value: string): string | null => {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.length === 0 || normalizedValue.startsWith("#")) {
    return null;
  }

  if (normalizedValue.startsWith("javascript:")) {
    return JAVASCRIPT_URL_REASON;
  }

  if (normalizedValue.startsWith("data:text/html")) {
    return HTML_DATA_URL_REASON;
  }

  if (normalizedValue.startsWith("data:")) {
    return DATA_URL_REASON;
  }

  if (
    normalizedValue.startsWith("//") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://")
  ) {
    return REMOTE_URL_REASON;
  }

  return NON_FRAGMENT_URL_REASON;
};

const getUnsafeCssUrlReason = (value: string): string | null => {
  for (const match of value.matchAll(CSS_URL_PATTERN)) {
    const urlValue = extractCssUrlValue(match[0]);
    const unsafeReason = getUnsafeReferenceReason(urlValue);

    if (unsafeReason !== null) {
      return unsafeReason;
    }
  }

  return null;
};

const getUnsafeAttributeReason = (attribute: Attr): string | null => {
  const attributeName = attribute.name.toLowerCase();

  if (EVENT_HANDLER_ATTRIBUTE_PATTERN.test(attributeName)) {
    return INLINE_EVENT_HANDLER_REASON;
  }

  if (REFERENCE_ATTRIBUTE_NAMES.has(attributeName)) {
    return getUnsafeReferenceReason(attribute.value);
  }

  return getUnsafeCssUrlReason(attribute.value);
};

const getUnsafeElementReason = (element: Element): string | null => {
  const blockedElementReason =
    BLOCKED_ELEMENT_REASONS[
      element.tagName.toLowerCase() as keyof typeof BLOCKED_ELEMENT_REASONS
    ];

  if (blockedElementReason !== undefined) {
    return blockedElementReason;
  }

  for (const attribute of Array.from(element.attributes)) {
    const unsafeReason = getUnsafeAttributeReason(attribute);

    if (unsafeReason !== null) {
      return unsafeReason;
    }
  }

  for (const childElement of Array.from(element.children)) {
    const unsafeReason = getUnsafeElementReason(childElement);

    if (unsafeReason !== null) {
      return unsafeReason;
    }
  }

  return null;
};

export const getUnsafeSvgReason = (svg: string): string | null => {
  const rootElement = getRootSvgElement(svg);

  if (rootElement === null) {
    return null;
  }

  return getUnsafeElementReason(rootElement);
};
