import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ShareFeedbackState } from "./controller/use-copy-share-url";

import { useShareButton } from "./use-share-button";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

type ShareButtonHarnessProps = {
  shareAnnouncement: string;
  shareButtonLabel: string;
  shareButtonState: ShareFeedbackState;
};

const ShareButtonHarness = (props: ShareButtonHarnessProps) => {
  const shareButton = useShareButton(props);
  latestShareButton = shareButton;

  return (
    <div>
      <button
        data-share-feedback-state={shareButton.shareButtonState}
        ref={shareButton.shareButtonRef}
        style={shareButton.shareButtonStyle}
        type="button"
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
      <output>{shareButton.shareAnnouncement}</output>
    </div>
  );
};

const UnwiredShareButtonHarness = (props: ShareButtonHarnessProps) => {
  const shareButton = useShareButton(props);

  return <output>{JSON.stringify(shareButton.shareButtonStyle)}</output>;
};

let container: HTMLDivElement;
let root: Root;
let latestShareButton: ReturnType<typeof useShareButton> | null = null;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function mockRect(this: HTMLElement) {
      const width =
        this instanceof HTMLButtonElement
          ? 132
          : this.classList.contains("share-button-text") ||
              this.classList.contains("share-button-measure")
            ? this.textContent === "Copied"
              ? 44
              : 96
            : 0;

      return {
        bottom: 16,
        height: 16,
        left: 0,
        right: width,
        toJSON: () => {
          return {};
        },
        top: 0,
        width,
        x: 0,
        y: 0,
      } as DOMRect;
    },
  );
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  latestShareButton = null;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });

  vi.restoreAllMocks();
});

describe("use-share-button", () => {
  it("derives width and announcement from the share feedback state", async () => {
    await act(async () => {
      root.render(
        <ShareButtonHarness
          shareAnnouncement=""
          shareButtonLabel="Copy share URL"
          shareButtonState="idle"
        />,
      );
      await flush();
    });

    expect(container.querySelector("button")?.style.inlineSize).toBe("132px");
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("idle");
    expect(container.querySelector("output")?.textContent).toBe("");

    await act(async () => {
      root.render(
        <ShareButtonHarness
          shareAnnouncement="Share URL copied"
          shareButtonLabel="Copied"
          shareButtonState="success"
        />,
      );
      await flush();
    });

    expect(container.querySelector("button")?.style.inlineSize).toBe("80px");
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("success");
    expect(container.querySelector("output")?.textContent).toBe(
      "Share URL copied",
    );
  });

  it("keeps the inline style empty when the measurement refs are unavailable", async () => {
    await act(async () => {
      root.render(
        <UnwiredShareButtonHarness
          shareAnnouncement=""
          shareButtonLabel="Copy share URL"
          shareButtonState="idle"
        />,
      );
      await flush();
    });

    expect(container.querySelector("output")?.textContent).toBe("{}");
  });

  it("keeps the returned share button view model stable across rerenders when props are unchanged", async () => {
    await act(async () => {
      root.render(
        <ShareButtonHarness
          shareAnnouncement=""
          shareButtonLabel="Copy share URL"
          shareButtonState="idle"
        />,
      );
      await flush();
    });

    const previousShareButton = latestShareButton;

    await act(async () => {
      root.render(
        <ShareButtonHarness
          shareAnnouncement=""
          shareButtonLabel="Copy share URL"
          shareButtonState="idle"
        />,
      );
      await flush();
    });

    expect(latestShareButton).not.toBeNull();
    expect(latestShareButton).toBe(previousShareButton);
  });
});
