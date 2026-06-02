import { useMemo } from "react";

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
  const packageName = useMemo(() => {
    return getPlaygroundPackageName(definition.slug);
  }, [definition.slug]);
  const transitionNames = useMemo(() => {
    return getPlaygroundViewTransitionNames(definition.slug);
  }, [definition.slug]);
  const shareButton = useShareButton({
    shareAnnouncement: viewModel.shareAnnouncement,
    shareButtonLabel: viewModel.shareButtonLabel,
    shareButtonState: viewModel.shareButtonState,
  });

  return (
    <SvgPlaygroundView
      activePresetId={viewModel.activePresetId}
      canShareUrl={viewModel.canShareUrl}
      color={viewModel.queryState.color}
      copyShareUrl={viewModel.copyShareUrl}
      inputSvg={viewModel.queryState.svg}
      packageName={packageName}
      previewHtml={viewModel.previewHtml}
      reactSourceState={viewModel.reactSourceState}
      rippleHandlers={rippleHandlers}
      selectPreset={viewModel.selectPreset}
      setColor={viewModel.setColor}
      setSize={viewModel.setSize}
      setStrokeWidth={viewModel.setStrokeWidth}
      setSvg={viewModel.setSvg}
      shareButton={shareButton}
      size={viewModel.queryState.size}
      slug={definition.slug}
      slugTransitionName={transitionNames.slug}
      stepStrokeWidth={viewModel.stepStrokeWidth}
      strokeWidth={viewModel.queryState.strokeWidth}
      title={definition.title}
      titleTransitionName={transitionNames.title}
      transformState={viewModel.transformState}
      visiblePresets={viewModel.visiblePresets}
    />
  );
};
