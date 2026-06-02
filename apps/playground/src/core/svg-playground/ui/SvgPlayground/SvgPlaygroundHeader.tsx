import { PackageIcon } from "@primer/octicons-react";
import { type CSSProperties, memo, useMemo } from "react";

import { useSvgPlaygroundHeaderContext } from "./SvgPlaygroundContext";

export const SvgPlaygroundHeader = memo(function SvgPlaygroundHeader() {
  const {
    canShareUrl,
    copyShareUrl,
    packageName,
    rippleHandlers,
    shareButton,
    slug,
    slugTransitionName,
    title,
    titleTransitionName,
  } = useSvgPlaygroundHeaderContext();
  const titleTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: titleTransitionName,
    };
  }, [titleTransitionName]);
  const slugTransitionStyle = useMemo<CSSProperties>(() => {
    return {
      viewTransitionName: slugTransitionName,
    };
  }, [slugTransitionName]);

  return (
    <section className="intro-band">
      <div className="intro-copy">
        <h1
          className="intro-title"
          data-view-transition-name={titleTransitionName}
          style={titleTransitionStyle}
        >
          {title}
        </h1>
        <div className="intro-meta">
          <a
            className="slug-chip"
            data-view-transition-name={slugTransitionName}
            href="../"
            style={slugTransitionStyle}
          >
            /{slug}
          </a>
          {packageName !== null ? (
            <code className="package-chip">
              <span aria-hidden="true" className="package-chip-icon">
                <PackageIcon size={12} />
              </span>
              <span>{packageName}</span>
            </code>
          ) : null}
        </div>
      </div>

      <div className="intro-actions">
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
      </div>
    </section>
  );
});
