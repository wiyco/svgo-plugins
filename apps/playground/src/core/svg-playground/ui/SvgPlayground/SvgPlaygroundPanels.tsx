import { memo } from "react";

import { InputPanel } from "./panels/InputPanel";
import { OptimizedPanel } from "./panels/OptimizedPanel";
import { PreviewPanel } from "./panels/PreviewPanel";
import { ReactSourcePanel } from "./panels/ReactSourcePanel";

export const SvgPlaygroundPanels = memo(function SvgPlaygroundPanels() {
  return (
    <section className="workbench-grid" aria-label="Playground panels">
      <PreviewPanel />
      <InputPanel />
      <OptimizedPanel />
      <ReactSourcePanel />
    </section>
  );
});
