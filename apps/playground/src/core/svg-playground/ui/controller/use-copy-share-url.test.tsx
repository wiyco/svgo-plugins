import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLIPBOARD_UNAVAILABLE_LABEL,
  COPIED_SHARE_BUTTON_LABEL,
  COPY_FAILED_LABEL,
  DEFAULT_SHARE_BUTTON_LABEL,
  SHARE_FEEDBACK_RESET_DELAY_MS,
  SHARE_URL_COPIED_ANNOUNCEMENT,
  UNSAFE_SHARE_MESSAGE,
  useCopyShareUrl,
} from "./use-copy-share-url";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

type CopyShareUrlHarnessProps = {
  canShare?: boolean;
};

const CopyShareUrlHarness = (props: CopyShareUrlHarnessProps) => {
  const { canShare = true } = props;
  const {
    copyShareUrl,
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
  } = useCopyShareUrl({
    canShare,
  });
  latestCopyShareUrl = copyShareUrl;

  return (
    <div>
      <button
        data-share-feedback-state={shareButtonState}
        type="button"
        onClick={copyShareUrl}
      >
        {shareButtonLabel}
      </button>
      <output>{shareAnnouncement}</output>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;
let originalClipboard: Clipboard | undefined;
let latestCopyShareUrl: (() => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  originalClipboard = navigator.clipboard;
  latestCopyShareUrl = null;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
  vi.useRealTimers();
});

describe("use-copy-share-url", () => {
  it("blocks clipboard writes when sharing is unavailable", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(
      async () => undefined,
    );

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      } as unknown as Clipboard,
    });

    await act(async () => {
      root.render(<CopyShareUrlHarness canShare={false} />);
      await flush();
    });

    await act(async () => {
      container.querySelector("button")?.click();
      await flush();
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(container.querySelector("button")?.textContent).toBe(
      UNSAFE_SHARE_MESSAGE,
    );
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("unsafe");
    expect(container.querySelector("output")?.textContent).toBe(
      UNSAFE_SHARE_MESSAGE,
    );
  });

  it("reports when the clipboard API is unavailable and resets", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    await act(async () => {
      root.render(<CopyShareUrlHarness />);
      await flush();
    });

    await act(async () => {
      container.querySelector("button")?.click();
      await flush();
    });

    expect(container.querySelector("button")?.textContent).toBe(
      CLIPBOARD_UNAVAILABLE_LABEL,
    );
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("unavailable");
    expect(container.querySelector("output")?.textContent).toBe(
      CLIPBOARD_UNAVAILABLE_LABEL,
    );

    await act(async () => {
      vi.advanceTimersByTime(SHARE_FEEDBACK_RESET_DELAY_MS);
      await flush();
    });

    expect(container.querySelector("button")?.textContent).toBe(
      DEFAULT_SHARE_BUTTON_LABEL,
    );
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("idle");
    expect(container.querySelector("output")?.textContent).toBe("");
  });

  it("reports success and failure from clipboard writes", async () => {
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("denied"));

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      } as unknown as Clipboard,
    });

    await act(async () => {
      root.render(<CopyShareUrlHarness />);
      await flush();
    });

    await act(async () => {
      container.querySelector("button")?.click();
      await flush();
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(container.querySelector("button")?.textContent).toBe(
      COPIED_SHARE_BUTTON_LABEL,
    );
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("success");
    expect(container.querySelector("output")?.textContent).toBe(
      SHARE_URL_COPIED_ANNOUNCEMENT,
    );

    await act(async () => {
      vi.advanceTimersByTime(SHARE_FEEDBACK_RESET_DELAY_MS);
      await flush();
    });

    expect(container.querySelector("button")?.textContent).toBe(
      DEFAULT_SHARE_BUTTON_LABEL,
    );
    expect(container.querySelector("output")?.textContent).toBe("");

    await act(async () => {
      container.querySelector("button")?.click();
      await flush();
    });

    expect(container.querySelector("button")?.textContent).toBe(
      COPY_FAILED_LABEL,
    );
    expect(
      container
        .querySelector("button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("failed");
    expect(container.querySelector("output")?.textContent).toBe(
      COPY_FAILED_LABEL,
    );
  });

  it("keeps copyShareUrl stable across rerenders when canShare is unchanged", async () => {
    await act(async () => {
      root.render(<CopyShareUrlHarness canShare />);
      await flush();
    });

    const previousCopyShareUrl = latestCopyShareUrl;

    await act(async () => {
      root.render(<CopyShareUrlHarness canShare />);
      await flush();
    });

    expect(latestCopyShareUrl).not.toBeNull();
    expect(latestCopyShareUrl).toBe(previousCopyShareUrl);
  });
});
