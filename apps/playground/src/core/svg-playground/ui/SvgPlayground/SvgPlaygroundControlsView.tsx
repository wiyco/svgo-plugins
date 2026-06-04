import { ChevronDownIcon, GearIcon } from "@primer/octicons-react";
import { type ReactNode, memo } from "react";

import type { RippleHandlers } from "../use-press-ripple";
import type { CommandDockViewModel } from "./use-command-dock-view-model";

type SvgPlaygroundControlsViewProps = {
  children: ReactNode;
  commandDock: CommandDockViewModel;
  rippleHandlers: RippleHandlers;
};

export const SvgPlaygroundControlsView = memo(
  function SvgPlaygroundControlsView(props: SvgPlaygroundControlsViewProps) {
    const { children, commandDock, rippleHandlers } = props;

    return (
      <section
        className="command-dock"
        aria-label="Playground controls"
        data-expanded={commandDock.isExpanded ? "true" : "false"}
      >
        <button
          aria-controls={commandDock.controlsId}
          aria-expanded={commandDock.isExpanded}
          aria-label={commandDock.summaryAriaLabel}
          className="command-dock-summary ripple-surface"
          ref={commandDock.summaryButtonRef}
          type="button"
          onClick={commandDock.onSummaryClick}
          {...rippleHandlers}
        >
          <span aria-hidden="true" className="command-dock-summary-icon">
            <GearIcon size={16} />
          </span>
          <span className="command-dock-summary-metrics">
            <span className="command-dock-summary-metric">
              {commandDock.strokeWidthLabel}
            </span>
            <span className="command-dock-summary-metric">
              {commandDock.sizeLabel}
            </span>
            <span className="command-dock-summary-metric command-dock-summary-color">
              <span
                aria-hidden="true"
                className="command-dock-summary-swatch"
                style={commandDock.colorSwatchStyle}
              />
              <code>{commandDock.colorLabel}</code>
            </span>
          </span>
          <span aria-hidden="true" className="command-dock-summary-chevron">
            <ChevronDownIcon size={16} />
          </span>
        </button>
        <div className="command-dock-details" id={commandDock.controlsId}>
          <div className="command-dock-details-inner">{children}</div>
        </div>
      </section>
    );
  },
);
