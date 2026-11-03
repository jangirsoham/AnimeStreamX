import { useEffect } from "react";
import { Check } from "lucide-react";
import { Header, Footer } from "./components";
import { NavigationProvider, useNavigation } from "./navigation";
import { LibraryProvider, useLibrary } from "./library";
import { findTitle } from "./editorial";
import { ScrollTools, usePageMotion } from "./motion";
import { useContentGuard } from "./content-guard";
import {
  Home,
  Browse,
  Collections,
  CollectionDetail,
  TitleDetail,
  Watch,
  Watchlist,
  Help,
  NotFound,
} from "./pages";

function Shell() {
  const { url } = useNavigation();
  const { notice } = useLibrary();
  usePageMotion(url.pathname);
  useContentGuard();
  const parts = url.pathname.split("/").filter(Boolean);
  const title = findTitle(parts[1]);
  let page;
  let pageTitle = "Your next world awaits";
  if (!parts.length) page = <Home />;
  else if (
    ["catalog", "movies", "anime"].includes(parts[0]) &&
    parts.length === 1
  ) {
    page = <Browse />;
    pageTitle =
      parts[0] === "movies"
        ? "Movies"
        : parts[0] === "anime"
          ? "Series"
          : "Explore";
  } else if (parts[0] === "collections" && parts.length === 1) {
    page = <Collections />;
    pageTitle = "Collections";
  } else if (parts[0] === "collection" && parts.length === 2) {
    page = <CollectionDetail id={parts[1]} />;
    pageTitle = "A collection for every mood";
  } else if (parts[0] === "watchlist" && parts.length === 1) {
    page = <Watchlist />;
    pageTitle = "My list";
  } else if (parts[0] === "help" && parts.length === 1) {
    page = <Help />;
    pageTitle = "Help & information";
  } else if (parts[0] === "title" && title && parts.length === 2) {
    page = <TitleDetail key={title.id} title={title} />;
    pageTitle = title.title;
  } else if (parts[0] === "watch" && title && parts.length <= 3) {
    page = (
      <Watch
        key={`${title.id}/${parts[2]}`}
        title={title}
        episodeId={parts[2]}
      />
    );
    pageTitle = `Watch ${title.title}`;
  } else {
    page = <NotFound />;
    pageTitle = "Page not found";
  }

  useEffect(() => {
    document.title = `${pageTitle} · AnimStreamX`;
  }, [pageTitle]);
  useEffect(() => {
    if (url.searchParams.has("search")) return;
    const element = url.hash
      ? document.getElementById(url.hash.slice(1))
      : document.getElementById("main-content");
    if (url.hash) element?.scrollIntoView();
    element?.focus({ preventScroll: true });
  }, [url.pathname, url.hash]);
  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" tabIndex={-1}>
        {page}
      </main>
      <Footer />
      <ScrollTools routeKey={url.pathname} />
      <div
        className={`toast ${notice ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <Check size={17} />
            <span>{notice}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <NavigationProvider>
      <LibraryProvider>
        <Shell />
      </LibraryProvider>
    </NavigationProvider>
  );
}
