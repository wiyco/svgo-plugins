import { PLAYGROUND_CATALOG } from "../playgrounds/catalog";
import { createLandingPageViewModel } from "./landing-page-view-model";
import { LandingPagePresenter } from "./LandingPagePresenter";

const landingPageViewModel = createLandingPageViewModel(PLAYGROUND_CATALOG);

export const LandingPage = () => {
  return <LandingPagePresenter viewModel={landingPageViewModel} />;
};
