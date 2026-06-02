import { PackageIcon } from "@primer/octicons-react";
import { type CSSProperties } from "react";

import type { LandingCatalogItemViewModel } from "./landing-page-view-model";

import { usePlaygroundLinkWarmup } from "./use-playground-link-warmup";

type LandingCatalogItemProps = {
  playground: LandingCatalogItemViewModel;
};

const getViewTransitionStyle = (name: string): CSSProperties => {
  return {
    viewTransitionName: name,
  };
};

export const LandingCatalogItem = (props: LandingCatalogItemProps) => {
  const { playground } = props;
  const { handleWarmup, linkRef } = usePlaygroundLinkWarmup(playground.slug);

  return (
    <li className="landing-item">
      <a
        ref={linkRef}
        href={playground.href}
        onFocus={handleWarmup}
        onPointerEnter={handleWarmup}
      >
        <div className="landing-item-main">
          <div className="landing-item-meta">
            <code
              className="landing-item-slug"
              data-view-transition-name={playground.slugTransitionName}
              style={getViewTransitionStyle(playground.slugTransitionName)}
            >
              {playground.slug}
            </code>
            {playground.packageName !== null ? (
              <code className="landing-item-package">
                <span aria-hidden="true" className="landing-item-package-icon">
                  <PackageIcon size={12} />
                </span>
                <span>{playground.packageName}</span>
              </code>
            ) : null}
            <span className="landing-item-count">
              {playground.presetCountLabel}
            </span>
          </div>
          <div className="landing-item-copy">
            <strong
              className="landing-item-title"
              data-view-transition-name={playground.titleTransitionName}
              style={getViewTransitionStyle(playground.titleTransitionName)}
            >
              {playground.title}
            </strong>
            <p>{playground.summary}</p>
          </div>
        </div>
      </a>
    </li>
  );
};
