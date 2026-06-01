import { describe, expect, it } from "vitest";

import { getUnsafeSvgReason } from "./unsafe-svg";

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
    [`<svg><path onclick="alert(1)" /></svg>`, "Inline event handlers"],
    [`<svg><a href="javascript:alert(1)">x</a></svg>`, "javascript: URLs"],
    [`<svg><a href="data:text/html;base64,WA==">x</a></svg>`, "HTML data URLs"],
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
});
