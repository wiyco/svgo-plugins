import { describe, expect, it } from "vitest";

import { DEFAULT_QUERY_STATE } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { createPlaygroundStateCodec } from "./playground-state-codec";

const playgroundStateCodec = createPlaygroundStateCodec(DEFAULT_QUERY_STATE);

describe("playground-state-codec", () => {
  it("round-trips compressed svg state through the query string", () => {
    const input = {
      color: "#0f766e",
      size: 240,
      strokeWidth: 3.5,
      svg: `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" stroke="currentColor" stroke-width="2" /></svg>`,
    };

    const serialized = playgroundStateCodec.serialize(input);
    const parsed = playgroundStateCodec.parse(serialized);

    expect(serialized).not.toContain("<svg");
    expect(parsed).toEqual(input);
  });

  it("round-trips an explicitly empty svg through the query string", () => {
    const input = {
      ...DEFAULT_QUERY_STATE,
      svg: "",
    };

    const serialized = playgroundStateCodec.serialize(input);
    const parsed = playgroundStateCodec.parse(serialized);

    expect(parsed.svg).toBe("");
  });

  it("falls back to defaults when query params are invalid", () => {
    const parsed = playgroundStateCodec.parse(
      "?svg=%%%&color=nope&size=9999&strokeWidth=oops",
    );

    expect(parsed).toEqual(DEFAULT_QUERY_STATE);
  });

  it("accepts raw svg markup when the query string is not compressed", () => {
    const rawSvg = `<svg viewBox="0 0 24 24"><path d="M0 0L12 12" /></svg>`;
    const parsed = playgroundStateCodec.parse(
      `svg=${encodeURIComponent(rawSvg)}&color=%230f766e&size=128&strokeWidth=2`,
    );

    expect(parsed).toEqual({
      color: "#0f766e",
      size: 128,
      strokeWidth: 2,
      svg: rawSvg,
    });
  });
});
