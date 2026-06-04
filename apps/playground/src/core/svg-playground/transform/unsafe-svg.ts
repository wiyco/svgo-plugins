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
const EVENT_HANDLER_ATTRIBUTE_NAME_PATTERN = /^on/i;
const EVENT_HANDLER_ATTRIBUTE_PATTERN = /\son[a-z0-9:_-]*\s*=/iu;
const REFERENCE_ATTRIBUTE_NAMES = new Set(["href", "src", "xlink:href"]);
const REFERENCE_ATTRIBUTE_PATTERN =
  /\b(?:href|src|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/giu;
const SVG_ROOT_PATTERN = /<\s*svg\b/iu;
const BLOCKED_ELEMENT_PATTERNS = [
  {
    pattern: /<\s*script\b/iu,
    reason: SCRIPT_ELEMENT_REASON,
  },
  {
    pattern: /<\s*foreignobject\b/iu,
    reason: FOREIGN_OBJECT_REASON,
  },
  {
    pattern: /<\s*style\b/iu,
    reason: STYLE_ELEMENT_REASON,
  },
] as const;

const stripWrappingQuotes = (value: string): string => {
  return value.replace(/^(['"])(.*)\1$/u, "$2");
};

const extractReferenceAttributeValue = (
  attributeExpression: string,
): string => {
  return stripWrappingQuotes(attributeExpression.replace(/^[^=]*=\s*/u, ""));
};

const extractCssUrlValue = (cssUrlExpression: string): string => {
  return stripWrappingQuotes(
    cssUrlExpression.replace(/^url\(\s*/iu, "").replace(/\s*\)$/u, ""),
  );
};

const getRootSvgElement = (svg: string): Element | null => {
  if (typeof globalThis.DOMParser !== "function") {
    return null;
  }

  const document = new globalThis.DOMParser().parseFromString(
    svg,
    "image/svg+xml",
  );
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

  if (EVENT_HANDLER_ATTRIBUTE_NAME_PATTERN.test(attributeName)) {
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

const getFallbackUnsafeSvgReason = (svg: string): string | null => {
  if (!SVG_ROOT_PATTERN.test(svg)) {
    return null;
  }

  for (const { pattern, reason } of BLOCKED_ELEMENT_PATTERNS) {
    if (pattern.test(svg)) {
      return reason;
    }
  }

  if (EVENT_HANDLER_ATTRIBUTE_PATTERN.test(svg)) {
    return INLINE_EVENT_HANDLER_REASON;
  }

  for (const match of svg.matchAll(REFERENCE_ATTRIBUTE_PATTERN)) {
    const attributeValue = extractReferenceAttributeValue(match[0]);
    const unsafeReason = getUnsafeReferenceReason(attributeValue);

    if (unsafeReason !== null) {
      return unsafeReason;
    }
  }

  return getUnsafeCssUrlReason(svg);
};

export const getUnsafeSvgReason = (svg: string): string | null => {
  const rootElement = getRootSvgElement(svg);

  if (rootElement !== null) {
    return getUnsafeElementReason(rootElement);
  }

  return getFallbackUnsafeSvgReason(svg);
};
