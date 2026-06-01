import { describe, expect, it } from "vitest";

import {
  PREVIEW_COMPONENT_NAME,
  createPreviewComponentFromJs,
} from "./create-preview-component";

describe("create-preview-component", () => {
  it("returns a callable preview component", () => {
    const Preview = createPreviewComponentFromJs(
      `const ${PREVIEW_COMPONENT_NAME} = (props) => React.createElement("svg", props);`,
    );

    expect(typeof Preview).toBe("function");
  });

  it("throws when the generated module does not expose a component", () => {
    expect(() => {
      createPreviewComponentFromJs(`const ${PREVIEW_COMPONENT_NAME} = "nope";`);
    }).toThrow("Generated preview code did not expose SvgComponent.");
  });
});
