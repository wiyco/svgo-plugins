import type { CSSProperties } from "react";

import { PackageIcon } from "@primer/octicons-react";

import { getUnsafeSvgReason } from "../core/svg-playground/transform/unsafe-svg";
import { PLAYGROUNDS, getPlaygroundPackageName } from "../playgrounds/registry";
import { getPlaygroundViewTransitionNames } from "../view-transition-names";

const getViewTransitionStyle = (name: string): CSSProperties => {
  return {
    viewTransitionName: name,
  };
};

const getVisiblePresetCount = (svgs: readonly { svg: string }[]): number => {
  return svgs.filter((preset) => {
    return getUnsafeSvgReason(preset.svg) === null;
  }).length;
};

export const LandingPage = () => {
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
          {PLAYGROUNDS.map((playground) => {
            const presetCount = getVisiblePresetCount(playground.presets);
            const presetCountLabel = `${presetCount} preset${
              presetCount === 1 ? "" : "s"
            }`;
            const packageName = getPlaygroundPackageName(playground.slug);
            const transitionNames = getPlaygroundViewTransitionNames(
              playground.slug,
            );

            return (
              <li key={playground.slug} className="landing-item">
                <a href={`./${playground.slug}/`}>
                  <div className="landing-item-main">
                    <div className="landing-item-meta">
                      <code
                        className="landing-item-slug"
                        data-view-transition-name={transitionNames.slug}
                        style={getViewTransitionStyle(transitionNames.slug)}
                      >
                        {playground.slug}
                      </code>
                      {packageName !== null ? (
                        <code className="landing-item-package">
                          <span
                            aria-hidden="true"
                            className="landing-item-package-icon"
                          >
                            <PackageIcon size={12} />
                          </span>
                          <span>{packageName}</span>
                        </code>
                      ) : null}
                      <span className="landing-item-count">
                        {presetCountLabel}
                      </span>
                    </div>
                    <div className="landing-item-copy">
                      <strong
                        className="landing-item-title"
                        data-view-transition-name={transitionNames.title}
                        style={getViewTransitionStyle(transitionNames.title)}
                      >
                        {playground.title}
                      </strong>
                      <p>{playground.summary}</p>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
};
