const UNSAFE_SVG_RULES = [
  {
    reason: "Script elements are blocked in the playground preview.",
    pattern: /<script\b/i,
  },
  {
    reason:
      "Embedded HTML via <foreignObject> is blocked in the playground preview.",
    pattern: /<foreignObject\b/i,
  },
  {
    reason: "Inline event handlers are blocked in the playground preview.",
    pattern: /\son[a-z]+\s*=/i,
  },
  {
    reason: "javascript: URLs are blocked in the playground preview.",
    pattern: /\b(?:href|xlink:href)\s*=\s*['"]?\s*javascript:/i,
  },
  {
    reason: "HTML data URLs are blocked in the playground preview.",
    pattern: /\b(?:href|xlink:href)\s*=\s*['"]?\s*data:text\/html/i,
  },
];

export const getUnsafeSvgReason = (svg: string): string | null => {
  for (const rule of UNSAFE_SVG_RULES) {
    if (rule.pattern.test(svg)) {
      return rule.reason;
    }
  }

  return null;
};
