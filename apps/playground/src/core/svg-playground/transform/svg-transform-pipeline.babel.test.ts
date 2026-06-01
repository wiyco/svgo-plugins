import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@babel/core");
});

describe("svg-transform-pipeline babel fallback", () => {
  it("throws when Babel does not return preview code", async () => {
    vi.doMock("@babel/core", () => {
      return {
        transformSync: vi.fn<() => { code: undefined }>(() => {
          return {
            code: undefined,
          };
        }),
      };
    });

    const { jsxToPreviewModule } = await import("./svg-transform-pipeline");

    expect(() => {
      jsxToPreviewModule("const SvgComponent = () => <svg />;");
    }).toThrow("Babel did not return preview code.");
  });
});
