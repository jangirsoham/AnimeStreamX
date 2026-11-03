import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { normalizePathname, normalizeRouteUrl } from "./routing";

type Navigation = {
  url: URL;
  go: (path: string, options?: { replace?: boolean; scroll?: boolean }) => void;
};
const NavigationContext = createContext<Navigation | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState(() =>
    normalizeRouteUrl(new URL(window.location.href)),
  );
  useEffect(() => {
    const syncLocation = () => {
      const next = normalizeRouteUrl(new URL(window.location.href));
      if (next.href !== window.location.href)
        window.history.replaceState(window.history.state, "", next.href);
      setUrl(next);
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    return () => {
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("hashchange", syncLocation);
    };
  }, []);
  const go = useCallback<Navigation["go"]>((path, options = {}) => {
    const next = new URL(path, window.location.href);
    if (next.origin !== window.location.origin) {
      window.location[options.replace ? "replace" : "assign"](next.href);
      return;
    }
    next.pathname = normalizePathname(next.pathname);
    const sameLocation = next.href === window.location.href;
    if (!sameLocation)
      window.history[options.replace ? "replaceState" : "pushState"](
        {},
        "",
        next.href,
      );
    // A repeated navigation can still request focus (for example the search shortcut).
    setUrl(next);
    if (options.scroll === false) return;
    if (!next.hash) window.scrollTo({ top: 0, behavior: "instant" });
    else if (sameLocation) {
      let id = next.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* Keep literal IDs for malformed fragments. */
      }
      const element = document.getElementById(id);
      element?.scrollIntoView();
      element?.focus({ preventScroll: true });
    }
  }, []);
  return (
    <NavigationContext.Provider value={{ url, go }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("NavigationProvider is required");
  return context;
}

export function Link({
  href = "/",
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { go } = useNavigation();
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target.toLowerCase() !== "_self") ||
          (props.download != null && props.download !== false)
        )
          return;
        const target = new URL(event.currentTarget.href);
        if (target.origin !== window.location.origin) return;
        event.preventDefault();
        go(target.href);
      }}
    >
      {children}
    </a>
  );
}
