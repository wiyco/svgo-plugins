import { describe, expect, it } from "vitest";

import { getUnsafeSvgReason } from "./unsafe-svg";

describe("unsafe-svg", () => {
  it("flags script elements", () => {
    expect(
      getUnsafeSvgReason("<svg><script>alert(1)</script></svg>"),
    ).toContain("Script elements");
  });

  it("allows plain svg markup", () => {
    expect(
      getUnsafeSvgReason(
        `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" /></svg>`,
      ),
    ).toBeNull();
  });
});
