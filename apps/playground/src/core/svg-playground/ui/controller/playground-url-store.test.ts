import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocationHref,
  getLocationSearchSnapshot,
  replaceLocationSearch,
  subscribeToLocationSearch,
} from "./playground-url-store";

beforeEach(() => {
  window.history.replaceState(null, "", "/playground");
});

describe("playground-url-store", () => {
  it("builds absolute hrefs with and without query strings", () => {
    expect(createLocationHref("color=%23155eef")).toBe(
      "http://localhost:3000/playground?color=%23155eef",
    );
    expect(createLocationHref("")).toBe("http://localhost:3000/playground");
  });

  it("returns the current location search snapshot", () => {
    window.history.replaceState(null, "", "/playground?color=%23155eef");

    expect(getLocationSearchSnapshot()).toBe("?color=%23155eef");
  });

  it("updates the URL and notifies subscribers for search changes", () => {
    const callback = vi.fn<() => void>();
    const unsubscribe = subscribeToLocationSearch(callback);

    replaceLocationSearch("color=%230f766e");

    expect(window.location.pathname).toBe("/playground");
    expect(window.location.search).toBe("?color=%230f766e");
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("clears the search and avoids duplicate notifications for no-op writes", () => {
    const callback = vi.fn<() => void>();
    const unsubscribe = subscribeToLocationSearch(callback);

    replaceLocationSearch("");

    expect(window.location.pathname).toBe("/playground");
    expect(window.location.search).toBe("");
    expect(callback).not.toHaveBeenCalled();

    replaceLocationSearch("size=184");
    expect(callback).toHaveBeenCalledTimes(1);

    replaceLocationSearch("size=184");
    expect(callback).toHaveBeenCalledTimes(1);

    replaceLocationSearch("");

    expect(window.location.pathname).toBe("/playground");
    expect(window.location.search).toBe("");
    expect(callback).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("subscribes to popstate and stops after unsubscribe", () => {
    const callback = vi.fn<() => void>();
    const unsubscribe = subscribeToLocationSearch(callback);

    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
