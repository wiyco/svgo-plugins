import { describe, expect, it } from "vitest";

import { getUnsafeSvgReason } from "./unsafe-svg";

const withDomParserUnavailable = (assertions: () => void): void => {
  const domParserDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "DOMParser",
  );

  Object.defineProperty(globalThis, "DOMParser", {
    configurable: true,
    value: undefined,
  });

  try {
    assertions();
  } finally {
    if (domParserDescriptor === undefined) {
      delete (globalThis as { DOMParser?: typeof DOMParser }).DOMParser;
    } else {
      Object.defineProperty(globalThis, "DOMParser", domParserDescriptor);
    }
  }
};

describe("unsafe-svg", () => {
  it("flags script elements", () => {
    expect(
      getUnsafeSvgReason("<svg><script>alert(1)</script></svg>"),
    ).toContain("Script elements");
  });

  it.each([
    [
      `<svg><foreignObject><div>unsafe</div></foreignObject></svg>`,
      "Embedded HTML",
    ],
    [
      `<svg><style>@import "https://example.com/icon.css";</style></svg>`,
      "Style elements",
    ],
    [`<svg><path onclick="alert(1)" /></svg>`, "Inline event handlers"],
    [`<svg><a href="javascript:alert(1)">x</a></svg>`, "javascript: URLs"],
    [`<svg><a href="data:text/html;base64,WA==">x</a></svg>`, "HTML data URLs"],
    [`<svg><image href="data:image/svg+xml,%3Csvg/%3E" /></svg>`, "Data URLs"],
    [`<svg><image href="https://example.com/icon.svg" /></svg>`, "Remote URLs"],
    [
      `<svg><use xlink:href="//example.com/sprite.svg#icon" /></svg>`,
      "Remote URLs",
    ],
    [
      `<svg><use href="sprite.svg#icon" /></svg>`,
      "Only fragment-only URLs are allowed",
    ],
    [
      `<svg><path fill="url(https://example.com/fill.svg)" /></svg>`,
      "Remote URLs",
    ],
    [
      `<svg><path style="filter: url(javascript:alert(1))" /></svg>`,
      "javascript: URLs",
    ],
  ])("flags unsafe markup: %s", (svg, messageFragment) => {
    expect(getUnsafeSvgReason(svg)).toContain(messageFragment);
  });

  it("allows plain svg markup", () => {
    expect(
      getUnsafeSvgReason(
        `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" /></svg>`,
      ),
    ).toBeNull();
  });

  it("allows fragment-only url references", () => {
    expect(
      getUnsafeSvgReason(
        `<svg viewBox="0 0 24 24"><defs><linearGradient id="paint" /></defs><path fill="url(#paint)" /></svg>`,
      ),
    ).toBeNull();
  });

  it("allows empty css url references", () => {
    expect(
      getUnsafeSvgReason(
        `<svg viewBox="0 0 24 24"><path style="filter: url()" /></svg>`,
      ),
    ).toBeNull();
  });

  it("ignores non-svg roots", () => {
    expect(getUnsafeSvgReason(`<g><path d="M0 0L12 12" /></g>`)).toBeNull();
  });

  it("falls back to string scanning when DOMParser is unavailable", () => {
    withDomParserUnavailable(() => {
      expect(
        getUnsafeSvgReason(`<svg><script>alert(1)</script></svg>`),
      ).toContain("Script elements");
      expect(
        getUnsafeSvgReason(
          `<svg><image href="https://example.com/icon.svg" /></svg>`,
        ),
      ).toContain("Remote URLs");
      expect(
        getUnsafeSvgReason(`<svg><path onclick="alert(1)" /></svg>`),
      ).toContain("Inline event handlers");
      expect(getUnsafeSvgReason(`<svg><use href='#icon' /></svg>`)).toBeNull();
      expect(getUnsafeSvgReason(`<svg><use href=#icon /></svg>`)).toBeNull();
      expect(
        getUnsafeSvgReason(
          `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" /></svg>`,
        ),
      ).toBeNull();
      expect(getUnsafeSvgReason(`<g><path d="M0 0L12 12" /></g>`)).toBeNull();
    });
  });

  it.each([
    [`<svg><a href="javascript:alert(1)">x</a></svg>`, "javascript: URLs"],
    [`<svg><a href="data:text/html;base64,WA==">x</a></svg>`, "HTML data URLs"],
    [`<svg><image href="data:image/svg+xml,%3Csvg/%3E" /></svg>`, "Data URLs"],
    [
      `<svg><use xlink:href="//example.com/sprite.svg#icon" /></svg>`,
      "Remote URLs",
    ],
    [`<svg><image src="https://example.com/icon.svg" /></svg>`, "Remote URLs"],
    [
      `<svg><use href="sprite.svg#icon" /></svg>`,
      "Only fragment-only URLs are allowed",
    ],
  ])(
    "flags unsafe references during string scanning: %s",
    (svg, messageFragment) => {
      withDomParserUnavailable(() => {
        expect(getUnsafeSvgReason(svg)).toContain(messageFragment);
      });
    },
  );
});
