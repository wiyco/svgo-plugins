import { PLAYGROUND_CATALOG } from "../playgrounds/catalog";
import { createLandingPageViewModel } from "./landing-page-view-model";
import { LandingPagePresenter } from "./LandingPagePresenter";

export const LandingPage = () => {
  const viewModel = createLandingPageViewModel(PLAYGROUND_CATALOG);

  return <LandingPagePresenter viewModel={viewModel} />;
};
