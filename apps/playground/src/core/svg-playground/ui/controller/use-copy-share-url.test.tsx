import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyShareUrl } from "./use-copy-share-url";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const CopyShareUrlHarness = () => {
  const { copyShareUrl, copyStatus } = useCopyShareUrl();

  return (
    <div>
      <button type="button" onClick={copyShareUrl}>
        Copy
      </button>
      <output>{copyStatus}</output>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;
let originalClipboard: Clipboard | undefined;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  originalClipboard = navigator.clipboard;
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
});

describe("use-copy-share-url", () => {
  it("reports when the clipboard API is unavailable", async () => {
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

    expect(container.querySelector("output")?.textContent).toBe(
      "Clipboard unavailable",
    );
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
    expect(container.querySelector("output")?.textContent).toBe(
      "Share URL copied",
    );

    await act(async () => {
      container.querySelector("button")?.click();
      await flush();
    });

    expect(container.querySelector("output")?.textContent).toBe("Copy failed");
  });
});
