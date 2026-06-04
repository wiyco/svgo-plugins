import { memo } from "react";

import { ColorControl } from "./controls/ColorControl";
import { SizeControl } from "./controls/SizeControl";
import { StrokeWidthControl } from "./controls/StrokeWidthControl";
import { useSvgPlaygroundControlsContext } from "./SvgPlaygroundContext";
import { SvgPlaygroundControlsView } from "./SvgPlaygroundControlsView";
import { useCommandDockViewModel } from "./use-command-dock-view-model";

export const SvgPlaygroundControls = memo(function SvgPlaygroundControls() {
  const { color, rippleHandlers, size, strokeWidth } =
    useSvgPlaygroundControlsContext();
  const commandDock = useCommandDockViewModel({
    color,
    size,
    strokeWidth,
  });

  return (
    <SvgPlaygroundControlsView
      commandDock={commandDock}
      rippleHandlers={rippleHandlers}
    >
      <div className="dock-row dock-row-controls">
        <StrokeWidthControl />
        <SizeControl />
        <ColorControl />
      </div>
    </SvgPlaygroundControlsView>
  );
});
