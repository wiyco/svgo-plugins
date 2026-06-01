import * as React from "react";

import type { PreviewComponent } from "./types";

export const PREVIEW_COMPONENT_NAME = "SvgComponent";

export const createPreviewComponentFromJs = (
  previewCode: string,
): PreviewComponent => {
  const createComponent = new Function(
    "React",
    `${previewCode}\nreturn ${PREVIEW_COMPONENT_NAME};`,
  );
  const component = createComponent(React) as unknown;

  if (typeof component !== "function") {
    throw new Error("Generated preview code did not expose SvgComponent.");
  }

  return component as PreviewComponent;
};
