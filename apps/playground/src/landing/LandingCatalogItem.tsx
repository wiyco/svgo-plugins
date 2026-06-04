import { ChevronRightIcon, PackageIcon } from "@primer/octicons-react";

import type { LandingCatalogItemViewModel } from "./landing-page-view-model";

import { usePlaygroundLinkWarmup } from "./use-playground-link-warmup";

type LandingCatalogItemProps = {
  playground: LandingCatalogItemViewModel;
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
            <code className="landing-item-slug">{playground.slug}</code>
            {playground.packageName !== null ? (
              <code className="landing-item-package">
                <span aria-hidden="true" className="landing-item-package-icon">
                  <PackageIcon size={12} />
                </span>
                <span className="landing-item-package-name">
                  {playground.packageName}
                </span>
              </code>
            ) : null}
            <span className="landing-item-count">
              {playground.presetCountLabel}
            </span>
          </div>
          <div className="landing-item-copy">
            <span className="landing-item-title-row">
              <strong className="landing-item-title">{playground.title}</strong>
              <span aria-hidden="true" className="landing-item-disclosure">
                <ChevronRightIcon size={14} />
              </span>
            </span>
            <p>{playground.summary}</p>
          </div>
        </div>
      </a>
    </li>
  );
};
