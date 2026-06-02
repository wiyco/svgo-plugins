import { useEffect, useRef, useState } from "react";

export const DEFAULT_SHARE_BUTTON_LABEL = "Copy share URL";
export const COPIED_SHARE_BUTTON_LABEL = "Copied";
export const SHARE_URL_COPIED_ANNOUNCEMENT = "Share URL copied";
export const CLIPBOARD_UNAVAILABLE_LABEL = "Clipboard unavailable";
export const COPY_FAILED_LABEL = "Copy failed";
export const UNSAFE_SHARE_MESSAGE = "Sharing unavailable";
export const SHARE_FEEDBACK_RESET_DELAY_MS = 2000;

export type ShareFeedbackState =
  | "idle"
  | "success"
  | "unavailable"
  | "failed"
  | "unsafe";

const SHARE_BUTTON_LABELS: Record<ShareFeedbackState, string> = {
  failed: COPY_FAILED_LABEL,
  idle: DEFAULT_SHARE_BUTTON_LABEL,
  success: COPIED_SHARE_BUTTON_LABEL,
  unavailable: CLIPBOARD_UNAVAILABLE_LABEL,
  unsafe: UNSAFE_SHARE_MESSAGE,
};

const SHARE_ANNOUNCEMENTS: Record<ShareFeedbackState, string> = {
  failed: COPY_FAILED_LABEL,
  idle: "",
  success: SHARE_URL_COPIED_ANNOUNCEMENT,
  unavailable: CLIPBOARD_UNAVAILABLE_LABEL,
  unsafe: UNSAFE_SHARE_MESSAGE,
};

type UseCopyShareUrlOptions = {
  canShare?: boolean;
};

export const useCopyShareUrl = (options: UseCopyShareUrlOptions = {}) => {
  const { canShare = true } = options;
  const [shareFeedbackState, setShareFeedbackState] =
    useState<ShareFeedbackState>(canShare ? "idle" : "unsafe");
  const resetTimerIdRef = useRef<number | null>(null);

  const clearResetTimer = (): void => {
    if (resetTimerIdRef.current !== null) {
      window.clearTimeout(resetTimerIdRef.current);
      resetTimerIdRef.current = null;
    }
  };

  const setTransientShareFeedbackState = (
    nextState: Exclude<ShareFeedbackState, "idle" | "unsafe">,
  ): void => {
    clearResetTimer();
    setShareFeedbackState(nextState);
    resetTimerIdRef.current = window.setTimeout(() => {
      resetTimerIdRef.current = null;
      setShareFeedbackState("idle");
    }, SHARE_FEEDBACK_RESET_DELAY_MS);
  };

  useEffect(() => {
    clearResetTimer();
    setShareFeedbackState(canShare ? "idle" : "unsafe");
  }, [canShare]);

  useEffect(() => {
    return () => {
      clearResetTimer();
    };
  }, []);

  const copyShareUrl = (): void => {
    if (!canShare) {
      clearResetTimer();
      setShareFeedbackState("unsafe");
      return;
    }

    if (navigator.clipboard?.writeText === undefined) {
      setTransientShareFeedbackState("unavailable");
      return;
    }

    void navigator.clipboard.writeText(window.location.href).then(
      () => {
        setTransientShareFeedbackState("success");
      },
      () => {
        setTransientShareFeedbackState("failed");
      },
    );
  };

  return {
    copyShareUrl,
    shareAnnouncement: SHARE_ANNOUNCEMENTS[shareFeedbackState],
    shareButtonLabel: SHARE_BUTTON_LABELS[shareFeedbackState],
    shareButtonState: shareFeedbackState,
  };
};
