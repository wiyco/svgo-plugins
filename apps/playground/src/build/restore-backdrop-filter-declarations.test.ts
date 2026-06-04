import { describe, expect, it } from "vitest";

import { restoreBackdropFilterDeclarations } from "./restore-backdrop-filter-declarations";

describe("restoreBackdropFilterDeclarations", () => {
  it("restores the unprefixed backdrop-filter declaration before the prefixed one", () => {
    expect(
      restoreBackdropFilterDeclarations(
        ".command-dock{-webkit-backdrop-filter:blur(36px)saturate(185%)}",
      ),
    ).toBe(
      ".command-dock{backdrop-filter:blur(36px)saturate(185%);-webkit-backdrop-filter:blur(36px)saturate(185%)}",
    );
  });

  it("restores backdrop-filter declarations inside nested at-rules", () => {
    expect(
      restoreBackdropFilterDeclarations(
        "@media (prefers-contrast:more){.command-dock{-webkit-backdrop-filter:none}}",
      ),
    ).toBe(
      "@media (prefers-contrast:more){.command-dock{backdrop-filter:none;-webkit-backdrop-filter:none}}",
    );
  });

  it("does not duplicate declarations when the standard property is already present", () => {
    const css =
      ".command-dock{backdrop-filter:blur(36px)saturate(185%);-webkit-backdrop-filter:blur(36px)saturate(185%)}";

    expect(restoreBackdropFilterDeclarations(css)).toBe(css);
    expect(
      restoreBackdropFilterDeclarations(restoreBackdropFilterDeclarations(css)),
    ).toBe(css);
  });
});
