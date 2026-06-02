import { memo } from "react";

import { ColorControl } from "./controls/ColorControl";
import { SizeControl } from "./controls/SizeControl";
import { StrokeWidthControl } from "./controls/StrokeWidthControl";

export const SvgPlaygroundControls = memo(function SvgPlaygroundControls() {
  return (
    <section className="command-dock" aria-label="Playground controls">
      <div className="dock-row dock-row-controls">
        <StrokeWidthControl />
        <SizeControl />
        <ColorControl />
      </div>
    </section>
  );
});
