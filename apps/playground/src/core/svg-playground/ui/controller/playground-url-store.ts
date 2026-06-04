const PLAYGROUND_URL_CHANGE_EVENT = "svg-playground:url-change";

const createNextUrl = (search: string): string => {
  return search.length > 0 ? `?${search}` : window.location.pathname;
};

export const createLocationHref = (search: string): string => {
  const nextUrl = new URL(window.location.href);

  nextUrl.search = search.length > 0 ? `?${search}` : "";

  return nextUrl.toString();
};

export const getLocationSearchSnapshot = (): string => {
  return window.location.search;
};

export const subscribeToLocationSearch = (
  callback: () => void,
): (() => void) => {
  window.addEventListener("popstate", callback);
  window.addEventListener(PLAYGROUND_URL_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(PLAYGROUND_URL_CHANGE_EVENT, callback);
  };
};

export const replaceLocationSearch = (search: string): void => {
  const nextSearch = search.length > 0 ? `?${search}` : "";

  if (nextSearch === window.location.search) {
    return;
  }

  window.history.replaceState(null, "", createNextUrl(search));
  window.dispatchEvent(new Event(PLAYGROUND_URL_CHANGE_EVENT));
};
