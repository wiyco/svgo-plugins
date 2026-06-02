import type { SvgPlaygroundDefinition } from "../model";
import type { SvgPlaygroundViewModel } from "./controller/svg-playground-controller-types";

import { getPlaygroundPackageName } from "../../../playgrounds/registry";
import { getPlaygroundViewTransitionNames } from "../../../view-transition-names";
import { SvgPlaygroundView } from "./SvgPlaygroundView";
import { usePressRipple } from "./use-press-ripple";
import { useShareButton } from "./use-share-button";

type SvgPlaygroundPresenterProps = {
  definition: Pick<SvgPlaygroundDefinition, "slug" | "title">;
  viewModel: SvgPlaygroundViewModel;
};

export const SvgPlaygroundPresenter = (props: SvgPlaygroundPresenterProps) => {
  const { definition, viewModel } = props;
  const rippleHandlers = usePressRipple();
  const shareButton = useShareButton({
    shareAnnouncement: viewModel.shareAnnouncement,
    shareButtonLabel: viewModel.shareButtonLabel,
    shareButtonState: viewModel.shareButtonState,
  });

  return (
    <SvgPlaygroundView
      activePresetId={viewModel.activePresetId}
      canShareUrl={viewModel.canShareUrl}
      copyShareUrl={viewModel.copyShareUrl}
      packageName={getPlaygroundPackageName(definition.slug)}
      previewHtml={viewModel.previewHtml}
      queryState={viewModel.queryState}
      reactSourceState={viewModel.reactSourceState}
      rippleHandlers={rippleHandlers}
      selectPreset={viewModel.selectPreset}
      setColor={viewModel.setColor}
      setSize={viewModel.setSize}
      setStrokeWidth={viewModel.setStrokeWidth}
      setSvg={viewModel.setSvg}
      shareButton={shareButton}
      slug={definition.slug}
      stepStrokeWidth={viewModel.stepStrokeWidth}
      title={definition.title}
      transformState={viewModel.transformState}
      transitionNames={getPlaygroundViewTransitionNames(definition.slug)}
      visiblePresets={viewModel.visiblePresets}
    />
  );
};
