import { PackageIcon } from "@primer/octicons-react";
import { type ReactNode, memo } from "react";

import { useSvgPlaygroundHeaderContext } from "./SvgPlaygroundContext";

type SvgPlaygroundIntroProps = {
  actions?: ReactNode;
  packageName: string | null;
  slug: string;
  title: string;
};

export const SvgPlaygroundIntro = memo(function SvgPlaygroundIntro(
  props: SvgPlaygroundIntroProps,
) {
  const { actions, packageName, slug, title } = props;

  return (
    <section className="intro-band">
      <div className="intro-copy">
        <h1 className="intro-title">{title}</h1>
        <div className="intro-meta">
          <a className="slug-chip" href="../">
            /{slug}
          </a>
          {packageName !== null ? (
            <code className="package-chip">
              <span aria-hidden="true" className="package-chip-icon">
                <PackageIcon size={12} />
              </span>
              <span className="package-chip-name">{packageName}</span>
            </code>
          ) : null}
        </div>
      </div>

      {actions !== undefined ? (
        <div className="intro-actions">{actions}</div>
      ) : null}
    </section>
  );
});

export const SvgPlaygroundHeader = memo(function SvgPlaygroundHeader() {
  const {
    canShareUrl,
    copyShareUrl,
    packageName,
    rippleHandlers,
    shareButton,
    slug,
    title,
  } = useSvgPlaygroundHeaderContext();

  return (
    <SvgPlaygroundIntro
      actions={
        <>
          <button
            className="share-button ripple-surface"
            data-share-feedback-state={shareButton.shareButtonState}
            disabled={!canShareUrl}
            ref={shareButton.shareButtonRef}
            style={shareButton.shareButtonStyle}
            type="button"
            onClick={copyShareUrl}
            {...rippleHandlers}
          >
            <span aria-hidden="true" className="share-button-icon-wrap">
              {shareButton.shareButtonIcon}
            </span>
            <span
              ref={shareButton.shareButtonLabelRef}
              className="button-label share-button-text"
            >
              {shareButton.shareButtonLabel}
            </span>
            <span
              aria-hidden="true"
              ref={shareButton.shareButtonMeasureRef}
              className="share-button-measure"
            >
              {shareButton.shareButtonLabel}
            </span>
          </button>
          <span className="visually-hidden" aria-live="polite">
            {shareButton.shareAnnouncement}
          </span>
        </>
      }
      packageName={packageName}
      slug={slug}
      title={title}
    />
  );
});
