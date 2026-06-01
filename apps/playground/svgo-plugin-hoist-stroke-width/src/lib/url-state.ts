import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import { DEFAULT_QUERY_STATE } from "./presets";
import type { PlaygroundQueryState } from "./types";

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

const parseColor = (value: string | null): string => {
  if (value !== null && /^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  return DEFAULT_QUERY_STATE.color;
};

const parseSvg = (value: string | null): string => {
  if (value === null) {
    return DEFAULT_QUERY_STATE.svg;
  }

  const decompressed = decompressFromEncodedURIComponent(value);

  if (decompressed !== null && decompressed.length > 0) {
    return decompressed;
  }

  if (value.trimStart().startsWith("<svg")) {
    return value;
  }

  return DEFAULT_QUERY_STATE.svg;
};

export const serializePlaygroundState = (
  state: PlaygroundQueryState,
): string => {
  const params = new URLSearchParams();

  params.set("svg", compressToEncodedURIComponent(state.svg));
  params.set("strokeWidth", String(state.strokeWidth));
  params.set("color", state.color);
  params.set("size", String(state.size));

  return params.toString();
};

export const parsePlaygroundState = (search: string): PlaygroundQueryState => {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalizedSearch);

  return {
    svg: parseSvg(params.get("svg")),
    color: parseColor(params.get("color")),
    size: parseFiniteNumber(
      params.get("size"),
      DEFAULT_QUERY_STATE.size,
      64,
      320,
    ),
    strokeWidth: parseFiniteNumber(
      params.get("strokeWidth"),
      DEFAULT_QUERY_STATE.strokeWidth,
      0.5,
      8,
    ),
  };
};
