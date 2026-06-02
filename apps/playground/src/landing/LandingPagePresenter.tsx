import type { LandingPageViewModel } from "./landing-page-view-model";

import { LandingCatalogItem } from "./LandingCatalogItem";

type LandingPagePresenterProps = {
  viewModel: LandingPageViewModel;
};

export const LandingPagePresenter = (props: LandingPagePresenterProps) => {
  const { viewModel } = props;

  return (
    <main className="landing-shell">
      <header className="landing-header">
        <h1>SVGO playgrounds</h1>
        <p className="landing-copy">
          Open a slug to paste SVG, tune the shared controls, and inspect the
          transform output.
        </p>
      </header>

      <section
        className="landing-catalog"
        aria-labelledby="playground-catalog-title"
      >
        <h2 id="playground-catalog-title">Slug registry</h2>
        <ul className="landing-list">
          {viewModel.playgrounds.map((playground) => {
            return (
              <LandingCatalogItem
                key={playground.slug}
                playground={playground}
              />
            );
          })}
        </ul>
      </section>
    </main>
  );
};
