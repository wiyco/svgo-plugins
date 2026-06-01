const ROOT_ELEMENT_NAME = "svg";
const INDENT = "  ";

const getRootSvgElement = (svg: string): SVGSVGElement => {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const rootElement = document.documentElement;

  if (rootElement.tagName.toLowerCase() !== ROOT_ELEMENT_NAME) {
    throw new Error("Expected optimized SVG to contain a root <svg> element.");
  }

  return rootElement as unknown as SVGSVGElement;
};

const toCamelCase = (value: string): string => {
  return value.replace(/[:-]+([a-zA-Z])/g, (_, character: string) => {
    return character.toUpperCase();
  });
};

const toReactAttributeName = (name: string): string => {
  if (name === "class") {
    return "className";
  }

  if (name === "for") {
    return "htmlFor";
  }

  if (name.startsWith("aria-") || name.startsWith("data-")) {
    return name;
  }

  return toCamelCase(name);
};

const toStylePropertyName = (name: string): string => {
  if (name.startsWith("--")) {
    return JSON.stringify(name);
  }

  const camelCaseName = toCamelCase(name);

  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(camelCaseName)
    ? camelCaseName
    : JSON.stringify(camelCaseName);
};

const toStyleObjectLiteral = (styleText: string): string | null => {
  const entries = styleText
    .split(";")
    .map((declaration) => {
      return declaration.trim();
    })
    .filter((declaration) => {
      return declaration.length > 0;
    })
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      const propertyName = declaration.slice(0, separatorIndex).trim();
      const propertyValue = declaration.slice(separatorIndex + 1).trim();

      if (propertyName.length === 0 || propertyValue.length === 0) {
        return null;
      }

      return `${toStylePropertyName(propertyName)}: ${JSON.stringify(propertyValue)}`;
    })
    .filter((entry): entry is string => {
      return entry !== null;
    });

  if (entries.length === 0) {
    return null;
  }

  return `{{ ${entries.join(", ")} }}`;
};

const formatAttribute = (attribute: Attr): string | null => {
  if (attribute.name === "style") {
    const styleValue = toStyleObjectLiteral(attribute.value);

    return styleValue === null ? null : `style=${styleValue}`;
  }

  return `${toReactAttributeName(attribute.name)}=${JSON.stringify(attribute.value)}`;
};

const getMeaningfulChildNodes = (element: Element): ChildNode[] => {
  return Array.from(element.childNodes).filter((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return true;
    }

    return (node as Text).data.trim().length > 0;
  });
};

const serializeTextNode = (node: Text, depth: number): string => {
  const indent = INDENT.repeat(depth);

  return `${indent}{${JSON.stringify(node.data)}}`;
};

const serializeElement = (
  element: Element,
  depth: number,
  includeRootProps: boolean,
): string => {
  const indent = INDENT.repeat(depth);
  const attributes = Array.from(element.attributes)
    .map(formatAttribute)
    .filter((attribute): attribute is string => {
      return attribute !== null;
    });

  if (includeRootProps) {
    attributes.push("{...props}");
  }

  const openTag =
    attributes.length === 0
      ? `<${element.tagName}`
      : `<${element.tagName} ${attributes.join(" ")}`;
  const childNodes = getMeaningfulChildNodes(element);

  if (childNodes.length === 0) {
    return `${indent}${openTag} />`;
  }

  const children = childNodes.map((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return serializeTextNode(node as Text, depth + 1);
    }

    return serializeElement(node as Element, depth + 1, false);
  });

  return `${indent}${openTag}>\n${children.join("\n")}\n${indent}</${element.tagName}>`;
};

export const createReactSource = (optimizedSvg: string): string => {
  const rootElement = getRootSvgElement(optimizedSvg);
  const jsx = serializeElement(rootElement, 1, true);

  return `const SvgComponent = (props) => (\n${jsx}\n);`;
};
