import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import type { PlaygroundQueryState } from "../model";

export type PlaygroundStateCodec = {
  parse: (search: string) => PlaygroundQueryState;
  serialize: (state: PlaygroundQueryState) => string;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const parseFiniteNumber = (
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed < min || parsed > max) {
    return fallback;
  }

  return clamp(parsed, min, max);
};

const COMPRESSED_EMPTY_SVG = compressToEncodedURIComponent("");

export const createPlaygroundStateCodec = (
  defaultState: PlaygroundQueryState,
): PlaygroundStateCodec => {
  const parseColor = (value: string | null): string => {
    if (value !== null && /^#[0-9a-f]{6}$/i.test(value)) {
      return value;
    }

    return defaultState.color;
  };

  const parseSvg = (value: string | null): string => {
    if (value === null) {
      return defaultState.svg;
    }

    const decompressed = decompressFromEncodedURIComponent(value);

    if (
      decompressed !== null &&
      (decompressed.length > 0 || value === COMPRESSED_EMPTY_SVG)
    ) {
      return decompressed;
    }

    if (value.trimStart().startsWith("<svg")) {
      return value;
    }

    return defaultState.svg;
  };

  return {
    parse: (search) => {
      const normalizedSearch = search.startsWith("?")
        ? search.slice(1)
        : search;
      const params = new URLSearchParams(normalizedSearch);

      return {
        svg: parseSvg(params.get("svg")),
        color: parseColor(params.get("color")),
        size: parseFiniteNumber(params.get("size"), defaultState.size, 64, 320),
        strokeWidth: parseFiniteNumber(
          params.get("strokeWidth"),
          defaultState.strokeWidth,
          0.5,
          8,
        ),
      };
    },
    serialize: (state) => {
      const params = new URLSearchParams();

      params.set("svg", compressToEncodedURIComponent(state.svg));
      params.set("strokeWidth", String(state.strokeWidth));
      params.set("color", state.color);
      params.set("size", String(state.size));

      return params.toString();
    },
  };
};
