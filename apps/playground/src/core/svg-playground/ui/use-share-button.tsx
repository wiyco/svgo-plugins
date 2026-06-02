import { AlertIcon, CheckIcon, LinkIcon } from "@primer/octicons-react";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ShareFeedbackState } from "./controller/use-copy-share-url";

type UseShareButtonOptions = {
  shareAnnouncement: string;
  shareButtonLabel: string;
  shareButtonState: ShareFeedbackState;
};

export type UseShareButtonResult = {
  shareAnnouncement: string;
  shareButtonIcon: ReactNode;
  shareButtonLabel: string;
  shareButtonLabelRef: RefObject<HTMLSpanElement | null>;
  shareButtonMeasureRef: RefObject<HTMLSpanElement | null>;
  shareButtonRef: RefObject<HTMLButtonElement | null>;
  shareButtonState: ShareFeedbackState;
  shareButtonStyle: CSSProperties;
};

const renderShareButtonIcon = (shareButtonState: ShareFeedbackState) => {
  if (shareButtonState === "success") {
    return (
      <CheckIcon aria-hidden="true" className="share-button-icon" size={14} />
    );
  }

  if (
    shareButtonState === "failed" ||
    shareButtonState === "unavailable" ||
    shareButtonState === "unsafe"
  ) {
    return (
      <AlertIcon aria-hidden="true" className="share-button-icon" size={14} />
    );
  }

  return (
    <LinkIcon aria-hidden="true" className="share-button-icon" size={14} />
  );
};

export const useShareButton = (
  options: UseShareButtonOptions,
): UseShareButtonResult => {
  const { shareAnnouncement, shareButtonLabel, shareButtonState } = options;

  const shareButtonRef = useRef<HTMLButtonElement | null>(null);
  const shareButtonLabelRef = useRef<HTMLSpanElement | null>(null);
  const shareButtonMeasureRef = useRef<HTMLSpanElement | null>(null);
  const shareButtonChromeWidthRef = useRef<number | null>(null);
  const [shareButtonWidth, setShareButtonWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const button = shareButtonRef.current;
    const label = shareButtonLabelRef.current;
    const measure = shareButtonMeasureRef.current;

    if (button === null || label === null || measure === null) {
      return;
    }

    let chromeWidth = shareButtonChromeWidthRef.current;

    if (chromeWidth === null) {
      chromeWidth = Math.max(
        0,
        button.getBoundingClientRect().width -
          label.getBoundingClientRect().width,
      );
      shareButtonChromeWidthRef.current = chromeWidth;
    }

    const nextWidth = Math.ceil(
      measure.getBoundingClientRect().width + chromeWidth,
    );

    setShareButtonWidth((currentWidth) => {
      return currentWidth === nextWidth ? currentWidth : nextWidth;
    });
  }, [shareButtonLabel]);

  const shareButtonStyle = useMemo<CSSProperties>(() => {
    if (shareButtonWidth === null) {
      return {};
    }

    return {
      inlineSize: `${shareButtonWidth}px`,
    };
  }, [shareButtonWidth]);

  const shareButtonIcon = useMemo(() => {
    return renderShareButtonIcon(shareButtonState);
  }, [shareButtonState]);

  return useMemo(() => {
    return {
      shareAnnouncement,
      shareButtonIcon,
      shareButtonLabel,
      shareButtonLabelRef,
      shareButtonMeasureRef,
      shareButtonRef,
      shareButtonState,
      shareButtonStyle,
    };
  }, [
    shareAnnouncement,
    shareButtonIcon,
    shareButtonLabel,
    shareButtonState,
    shareButtonStyle,
  ]);
};
