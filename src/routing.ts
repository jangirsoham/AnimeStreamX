/** Every route uses the same path shape, including pasted and history URLs. */
export function normalizePathname(pathname: string): string {
  return `/${pathname.split("/").filter(Boolean).join("/")}`;
}

/** Keep search filters and fragments intact while normalizing only the route. */
export function normalizeRouteUrl(url: URL): URL {
  const normalized = new URL(url.href);
  normalized.pathname = normalizePathname(normalized.pathname);
  return normalized;
}
