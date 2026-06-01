import { describe, expect, it } from "vitest";

import { DEFAULT_QUERY_STATE } from "./presets";
import { parsePlaygroundState, serializePlaygroundState } from "./url-state";

describe("url-state", () => {
  it("round-trips compressed svg state through the query string", () => {
    const input = {
      color: "#0f766e",
      size: 240,
      strokeWidth: 3.5,
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" stroke="currentColor" stroke-width="2" /></svg>`,
    };

    const serialized = serializePlaygroundState(input);
    const parsed = parsePlaygroundState(serialized);

    expect(serialized).not.toContain("<svg");
    expect(parsed).toEqual(input);
  });

  it("falls back to defaults when query params are invalid", () => {
    const parsed = parsePlaygroundState(
      "?svg=%%%&color=nope&size=9999&strokeWidth=oops",
    );

    expect(parsed).toEqual(DEFAULT_QUERY_STATE);
  });
});
