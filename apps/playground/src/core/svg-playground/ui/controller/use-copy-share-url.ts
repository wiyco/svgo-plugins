import { useState } from "react";

export const useCopyShareUrl = () => {
  const [copyStatus, setCopyStatus] = useState("");

  const copyShareUrl = (): void => {
    if (navigator.clipboard?.writeText === undefined) {
      setCopyStatus("Clipboard unavailable");
      return;
    }

    void navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopyStatus("Share URL copied");
      },
      () => {
        setCopyStatus("Copy failed");
      },
    );
  };

  return {
    copyShareUrl,
    copyStatus,
  };
};
