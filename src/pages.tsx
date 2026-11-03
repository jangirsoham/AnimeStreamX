import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  AlertCircle,
  Film,
  Grid2X2,
  HelpCircle,
  Layers3,
  List,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import {
  getEpisodes,
  isPlayable,
  titles,
  type Episode,
  type Title,
} from "./data";
import {
  availableCount,
  collections,
  faqs,
  findTitle,
  firstPlayable,
  formatType,
  shortTitle,
  spotlights,
  titlePath,
  watchPath,
} from "./editorial";
import {
  Breadcrumbs,
  EmptyState,
  PageHeading,
  SaveButton,
  SectionHeading,
  TitleCard,
} from "./components";
import { Link, useNavigation } from "./navigation";
import { useLibrary } from "./library";
import { usePlayback } from "./playback";

const movieCount = titles.filter((title) => title.type === "Movie").length;
const seriesCount = titles.filter((title) => title.type === "Anime").length;
const genres = [
  "All",
  ...Array.from(new Set(titles.map((title) => title.genre))).sort((a, b) =>
    a.localeCompare(b),
  ),
];
const featuredTitles = [
  "solo-leveling",
  "chainsaw-man",
  "infinity-castle",
  "your-name",
  "avengers-endgame",
]
  .map((id) => findTitle(id))
  .filter((title): title is Title => Boolean(title));
const featuredSeries = findTitle("jujutsu-kaisen");

function WatchLink({
  title,
  episode = firstPlayable(title),
  label = "Watch now",
  className = "button button-primary",
}: {
  title: Title;
  episode?: Episode;
  label?: string;
  className?: string;
}) {
  return episode ? (
    <Link href={watchPath(title, episode.id)} className={className}>
      <Play size={17} fill="currentColor" />
      {label}
    </Link>
  ) : (
    <Link href={titlePath(title)} className="button button-secondary">
      View title
      <ArrowRight size={17} />
    </Link>
  );
}

function CollectionCard({
  collection,
  index,
}: {
  collection: (typeof collections)[number];
  index: number;
}) {
  return (
    <Link
      className={`collection-card collection-${collection.color}`}
      href={`/collection/${collection.id}`}
    >
      <img src={collection.image} alt="" loading="lazy" />
      <span className="collection-scrim" />
      <span className="collection-number">COLLECTION / 0{index + 1}</span>
      <span className="collection-card-copy">
        <span>{collection.subtitle}</span>
        <h3>{collection.title}</h3>
        <span className="collection-bottom">
          {collection.ids.length} titles
          <span className="circle-arrow">
            <ArrowUpRight size={20} />
          </span>
        </span>
      </span>
    </Link>
  );
}

export function Home() {
  const { go } = useNavigation();
  const [active, setActive] = useState(0);
  const spotlight = spotlights[active];
  const title = findTitle(spotlight.id)!;
  const { history } = useLibrary();
  return (
    <>
      <section className="home-hero" aria-label="Featured movies">
        <div className="hero-image" key={title.id}>
          <img
            src={title.image}
            alt=""
            style={{ objectPosition: spotlight.position }}
            fetchPriority="high"
          />
        </div>
        <div className="hero-scrim" />
        <div className="hero-grain" />
        <div className="hero-content" key={`${title.id}-copy`}>
          <p className="hero-kicker">
            <span className="live-dot" />
            THE SPOTLIGHT
            <span className="hero-kicker-divider" />
            {spotlight.kicker}
          </p>
          <h1>
            {spotlight.heading.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="hero-meta">
            <span className="outline-tag">{formatType(title)}</span>
            <span>{title.year}</span>
            <span className="tiny-dot" />
            <span>{title.genre}</span>
            <span className="tiny-dot" />
            <span>{title.runtime}</span>
            {title.rating !== "—" && (
              <span className="rating">
                <Star size={13} fill="currentColor" />
                {title.rating}
              </span>
            )}
          </div>
          <p className="hero-description">{spotlight.copy}</p>
          <div className="button-row">
            <WatchLink title={title} />
            <Link href={titlePath(title)} className="button button-glass">
              Explore title
              <ArrowUpRight size={18} />
            </Link>
            <SaveButton title={title} iconOnly className="hero-save" />
          </div>
        </div>
        <div className="hero-side-label">
          EXTRAORDINARY STORIES. ONE PLAY AWAY.
        </div>
        <div className="hero-bottom">
          <a href="#discover" className="hero-scroll">
            <span>FIND YOUR NEXT WORLD</span>
            <ArrowDown size={16} />
          </a>
          <div
            className="spotlight-switcher"
            role="group"
            aria-label="Choose a featured movie"
          >
            {spotlights.map((item, index) => (
              <button
                key={item.id}
                className={`spotlight-option ${active === index ? "active" : ""}`}
                onClick={() => setActive(index)}
                aria-pressed={active === index}
              >
                <span className="spotlight-line" />
                <span className="spotlight-option-content">
                  <span className="spotlight-digit">0{index + 1}</span>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </div>
          <span className="hero-pagination">
            0{active + 1}
            <span>/ {String(spotlights.length).padStart(2, "0")}</span>
          </span>
        </div>
      </section>
      <div className="discovery-bar">
        <span>
          <span className="small-star">✳</span> LESS SCROLLING. MORE STORIES.
        </span>
        <div>
          <Link href="/movies">
            <Film size={15} />
            Movie night
            <ArrowUpRight size={13} />
          </Link>
          <Link href="/anime">
            <Layers3 size={15} />
            Your next series
            <ArrowUpRight size={13} />
          </Link>
          <Link href="/collection/after-dark">
            After dark
            <ArrowUpRight size={13} />
          </Link>
          <button
            className="discovery-surprise"
            onClick={() => {
              const candidates = titles.filter(
                (item) => item.id !== title.id && firstPlayable(item),
              );
              const selection =
                candidates[Math.floor(Math.random() * candidates.length)];
              if (selection) go(titlePath(selection));
            }}
          >
            <Shuffle size={15} />
            Surprise me
          </button>
        </div>
      </div>
      <section className="content-section" id="discover">
        <SectionHeading
          eyebrow="YOUR NEXT OBSESSION"
          title="Worth pressing play."
          href="/catalog"
          action="Explore the catalog"
        />
        <div className="poster-grid home-poster-grid">
          {featuredTitles.map((item, index) => (
            <TitleCard key={item.id} title={item} index={index} />
          ))}
        </div>
      </section>
      {history.length > 0 && (
        <section className="content-section recent-home">
          <SectionHeading
            eyebrow="BACK FOR MORE?"
            title="Your last adventure."
            description="Jump back to an episode you opened. Playback position may reset."
            href="/watchlist?tab=history"
            action="Recently opened"
          />
          <HistoryCards limit={3} />
        </section>
      )}
      <section className="content-section collections-home">
        <SectionHeading
          eyebrow="PICK A MOOD. FIND A WORLD."
          title="A little curation goes a long way."
          href="/collections"
          action="All collections"
        />
        <div className="collection-grid">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>
      </section>
      {featuredSeries && (
        <section className="editorial-feature">
          <div className="editorial-feature-art">
            <img
              src={featuredSeries.image}
              alt={`The cast of ${featuredSeries.title}`}
              loading="lazy"
            />
            <span className="editorial-art-label">FROM THE VERY BEGINNING</span>
          </div>
          <div className="editorial-feature-copy">
            <p className="eyebrow">
              <span className="accent-line" />
              THE SERIES SPOTLIGHT
            </p>
            <h2>
              Some worlds
              <br />
              pull you <em>all in.</em>
            </h2>
            <p>
              A cursed object. An impossible choice. Start Yuji Itadori’s story
              and discover why the world of Jujutsu Kaisen is so hard to leave.
            </p>
            <div className="editorial-stats">
              <span>
                <strong>{availableCount(featuredSeries)}</strong>
                episodes available
              </span>
              <span>
                <strong>
                  {featuredSeries.rating}<span>/10</span>
                </strong>
                catalog rating
              </span>
            </div>
            <WatchLink title={featuredSeries} label="Start the series" />
            <Link href={titlePath(featuredSeries)} className="text-link">
              Explore seasons
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
      <section className="watchlist-banner">
        <span className="banner-icon">
          <Bookmark size={30} strokeWidth={1.4} />
        </span>
        <div>
          <p className="eyebrow">GOOD STORIES CAN WAIT</p>
          <h2>Found something? Make it yours.</h2>
          <p>Keep your next watches together. No account needed.</p>
        </div>
        <Link href="/watchlist" className="button button-light">
          Build your watchlist
          <ArrowUpRight size={18} />
        </Link>
        <span className="banner-decoration" aria-hidden="true">
          +
        </span>
      </section>
    </>
  );
}

export function Browse() {
  const { url, go } = useNavigation();
  const params = url.searchParams;
  const type =
    url.pathname === "/movies"
      ? "Movie"
      : url.pathname === "/anime"
        ? "Anime"
        : ["Movie", "Anime"].includes(params.get("type") ?? "")
          ? params.get("type")
          : "All";
  const query = params.get("q") ?? "";
  const genre = params.get("genre") ?? "All";
  const sort = params.get("sort") ?? "featured";
  const listView = params.get("view") === "list";
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (params.has("search")) searchInput.current?.focus();
  }, [url]);
  const setParam = (name: string, value: string, replace = false) => {
    const next = new URLSearchParams(params);
    next.delete("search");
    if (
      !value ||
      value === "All" ||
      (name === "sort" && value === "featured") ||
      (name === "view" && value === "grid")
    )
      next.delete(name);
    else next.set(name, value);
    go(`${url.pathname}${next.size ? `?${next}` : ""}`, {
      replace,
      scroll: false,
    });
  };
  const matching = titles.filter(
    (title) =>
      (type === "All" || title.type === type) &&
      (genre === "All" || title.genre === genre) &&
      `${title.title} ${title.genre}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  if (sort === "newest")
    matching.sort((a, b) => Number(b.year) - Number(a.year));
  if (sort === "az") matching.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "rating")
    matching.sort(
      (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0),
    );
  const basePath = url.pathname;
  return (
    <div className="page-container browse-page">
      <PageHeading
        eyebrow="THE CATALOG"
        title={
          type === "Movie"
            ? "Make tonight a movie night"
            : type === "Anime"
              ? "One episode is just the beginning"
              : "Find your next world"
        }
        description={
          type === "Movie"
            ? "Big stories. Unforgettable characters. All in one sitting."
            : type === "Anime"
              ? "Meet the characters you’ll want to keep coming back to."
              : "From first episodes to movie nights. Find the story for your next escape."
        }
      >
        <div className="page-heading-mark" aria-hidden="true">
          {type === "Movie" ? (
            <Film size={60} strokeWidth={1} />
          ) : (
            <Layers3 size={60} strokeWidth={1} />
          )}
        </div>
      </PageHeading>
      <div className="browse-toolbar">
        <nav className="category-tabs" aria-label="Catalog categories">
          <Link className={type === "All" ? "active" : ""} href="/catalog">
            Everything<span>{titles.length}</span>
          </Link>
          <Link className={type === "Movie" ? "active" : ""} href="/movies">
            Movies<span>{movieCount}</span>
          </Link>
          <Link className={type === "Anime" ? "active" : ""} href="/anime">
            Series<span>{seriesCount}</span>
          </Link>
        </nav>
        <label className="catalog-search">
          <Search size={18} />
          <input
            ref={searchInput}
            value={query}
            onChange={(event) => setParam("q", event.target.value, true)}
            placeholder="Search titles or genres"
            aria-label="Search titles or genres"
          />
          {query && (
            <button
              onClick={() => {
                setParam("q", "", true);
                searchInput.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </label>
      </div>
      <div className="filter-row">
        <div
          className="genre-filters"
          role="group"
          aria-label="Filter by genre"
        >
          <SlidersHorizontal size={16} />
          {genres.map((item) => (
            <button
              className={`filter-chip ${genre === item ? "active" : ""}`}
              aria-pressed={genre === item}
              onClick={() => setParam("genre", item)}
              key={item}
            >
              {item === "All" ? "All genres" : item}
            </button>
          ))}
        </div>
        <div className="sort-controls">
          <label>
            <span className="sr-only">Sort titles</span>
            <select
              aria-label="Sort titles"
              value={sort}
              onChange={(event) => setParam("sort", event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest first</option>
              <option value="az">Title A–Z</option>
              <option value="rating">Highest rated</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <div className="view-switch" role="group" aria-label="Display layout">
            <button
              aria-label="Grid view"
              aria-pressed={!listView}
              className={!listView ? "active" : ""}
              onClick={() => setParam("view", "grid")}
            >
              <Grid2X2 size={17} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={listView}
              className={listView ? "active" : ""}
              onClick={() => setParam("view", "list")}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      <p className="results-summary" aria-live="polite">
        {matching.length} {matching.length === 1 ? "title" : "titles"}
        {query.trim() && (
          <>
            {" "}
            matching <strong>“{query.trim()}”</strong>
          </>
        )}
      </p>
      {matching.length ? (
        <div
          className={`poster-grid ${listView ? "list-layout" : "browse-grid"}`}
        >
          {matching.map((title) => (
            <TitleCard key={title.id} title={title} wide={listView} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search size={30} />}
          title="A plot twist. No matches."
          description="Try a different title or give another genre a chance."
        >
          <button
            className="button button-primary"
            onClick={() => go(basePath, { scroll: false })}
          >
            Reset filters
            <RotateCcw size={16} />
          </button>
        </EmptyState>
      )}
      <div className="catalog-end">
        <span />
        YOU’VE REACHED THE END. YOUR NEXT STORY IS ABOVE.
        <span />
      </div>
      <div className="subtle-callout">
        <span>Need a little inspiration?</span>
        <Link href="/collections" className="text-link">
          Let a collection lead the way
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}

export function Collections() {
  return (
    <div className="page-container collections-page">
      <PageHeading
        eyebrow="THOUGHTFULLY PICKED"
        title="Follow the feeling"
        description="Sometimes you know the mood before you know the title. Start there."
      />
      <div className="collection-grid collection-grid-large">
        {collections.map((collection, index) => (
          <div key={collection.id}>
            <CollectionCard collection={collection} index={index} />
            <p className="collection-description">{collection.description}</p>
          </div>
        ))}
      </div>
      <div className="collection-note">
        <span className="small-star">✳</span>
        <p>
          Good stories find a way to stay with you.
          <br />
          <span>These are a few worth making room for.</span>
        </p>
        <Link href="/catalog" className="text-link">
          See every title
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}

export function CollectionDetail({ id }: { id: string }) {
  const collection = collections.find((item) => item.id === id);
  if (!collection) return <NotFound />;
  return (
    <>
      <section
        className={`collection-detail-hero collection-${collection.color}`}
      >
        <img src={collection.image} alt="" />
        <div className="collection-detail-scrim" />
        <div>
          <Breadcrumbs
            items={[
              { label: "Collections", href: "/collections" },
              { label: collection.title },
            ]}
          />
          <p className="eyebrow">THE ANIMSTREAMX COLLECTIONS</p>
          <h1>
            {collection.title}
            <span className="accent-dot">.</span>
          </h1>
          <p>{collection.description}</p>
          <span className="outline-tag">
            {collection.ids.length} handpicked titles
          </span>
        </div>
      </section>
      <section className="content-section">
        <SectionHeading
          title="Your lineup."
          description="Every great evening starts with a good story."
        />
        <div className="poster-grid collection-titles">
          {collection.ids.map((titleId, index) => (
            <TitleCard
              key={titleId}
              title={findTitle(titleId)!}
              index={index}
            />
          ))}
        </div>
        <Link className="text-link back-to-collections" href="/collections">
          <ArrowLeft size={17} />
          Explore another collection
        </Link>
      </section>
    </>
  );
}

function EpisodeRow({
  title,
  episode,
  selected = false,
}: {
  title: Title;
  episode: Episode;
  selected?: boolean;
}) {
  const playable = isPlayable(episode);
  const artwork =
    title.seasons?.find((season) => season.id === episode.seasonId)?.image ??
    title.image;
  const content = (
    <>
      <span className="episode-thumb">
        <img src={artwork} alt="" loading="lazy" />
        <span>
          {playable ? (
            <Play size={18} fill="currentColor" />
          ) : (
            <Clock3 size={18} />
          )}
        </span>
        <b>{String(episode.number).padStart(2, "0")}</b>
      </span>
      <span className="episode-row-copy">
        <span className="episode-row-eyebrow">
          {title.type === "Movie"
            ? "FEATURE FILM"
            : `EPISODE ${String(episode.number).padStart(2, "0")}`}
          {selected && <span>SELECTED</span>}
        </span>
        <strong>{episode.title}</strong>
        <span className="episode-description">
          {episode.description}
        </span>
      </span>
      <span className="episode-row-end">
        <span className={`availability-label ${playable ? "ready" : ""}`}>
          {playable ? (
            <>
              <span className="live-dot" />
              Ready to watch
            </>
          ) : (
            "Not available yet"
          )}
        </span>
        <span>
          {episode.duration}
          {playable && <ChevronRight size={16} />}
        </span>
      </span>
    </>
  );
  return playable ? (
    <Link
      href={watchPath(title, episode.id)}
      className={`episode-row ${selected ? "selected" : ""}`}
    >
      {content}
    </Link>
  ) : (
    <div className="episode-row unavailable">{content}</div>
  );
}

export function TitleDetail({ title }: { title: Title }) {
  const { url, go } = useNavigation();
  const seasons = title.seasons;
  const season =
    seasons?.find((item) => item.id === url.searchParams.get("season")) ??
    seasons?.[0];
  const artwork = season?.image ?? title.image;
  const onlyAvailable = url.searchParams.get("available") === "1";
  const episodes = season?.episodes ?? title.episodes ?? [];
  const availableEpisodes = episodes.filter(isPlayable);
  const visibleEpisodes = onlyAvailable ? availableEpisodes : episodes;
  const available = availableEpisodes.length;
  const playable = availableEpisodes[0];
  const titleEpisodes = getEpisodes(title);
  const allEpisodesAvailable =
    titleEpisodes.length > 0 && titleEpisodes.every(isPlayable);
  const [tab, setTab] = useState("episodes");
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(url.searchParams);
    value ? next.set(name, value) : next.delete(name);
    go(`${titlePath(title)}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const related = titles.filter((item) => item.id !== title.id).slice(0, 4);
  return (
    <>
      <section className="title-hero">
        <img className="title-backdrop" src={artwork} alt="" />
        <div className="title-backdrop-shade" />
        <div className="title-hero-inner">
          <Breadcrumbs
            items={[
              {
                label: title.type === "Anime" ? "Series" : "Movies",
                href: title.type === "Anime" ? "/anime" : "/movies",
              },
              { label: shortTitle(title) },
            ]}
          />
          <div className="title-hero-grid">
            <div className="detail-poster">
              <img
                src={artwork}
                alt={`${title.title}${season ? ` · ${season.label}` : ""} poster`}
                width="400"
                height="600"
              />
              <span>
                <span className="live-dot" />
                {title.type === "Anime"
                  ? allEpisodesAvailable
                    ? "ALL EPISODES AVAILABLE"
                    : "SELECT EPISODES AVAILABLE"
                  : "READY TO WATCH"}
              </span>
            </div>
            <div className="title-hero-copy">
              <p className="eyebrow">
                {title.type === "Anime"
                  ? "YOUR NEXT GREAT SERIES"
                  : "THE BIG-SCREEN EXPERIENCE"}
              </p>
              <h1>{shortTitle(title)}</h1>
              <div className="detail-meta">
                <span className="outline-tag">{formatType(title)}</span>
                <span>{title.year}</span>
                <span className="tiny-dot" />
                <span>{title.runtime}</span>
                {title.rating !== "—" && (
                  <span className="rating">
                    <Star size={14} fill="currentColor" />
                    {title.rating}
                    <span>/ 10</span>
                  </span>
                )}
              </div>
              <p className="title-synopsis">{title.description}</p>
              <Link
                className="genre-link"
                href={`/catalog?genre=${encodeURIComponent(title.genre)}`}
              >
                {title.genre}
                <ArrowUpRight size={12} />
              </Link>
              <div className="button-row">
                {season && !playable ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled
                  >
                    <Clock3 size={17} />
                    Season unavailable
                  </button>
                ) : (
                  <WatchLink
                    title={title}
                    episode={playable}
                    label={
                      title.type === "Movie"
                        ? "Watch movie"
                        : season
                          ? "Start this season"
                          : "Start watching"
                    }
                  />
                )}
                <SaveButton title={title} />
              </div>
              <p className="title-availability-note">
                <Check size={13} />
                {title.type === "Anime"
                  ? `${availableCount(title)} of ${getEpisodes(title).length} episodes available across the catalog`
                  : `${title.runtime} · Available now`}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="page-container title-body">
        <div
          className="detail-tabs"
          role="group"
          aria-label="Title information"
        >
          <button
            className={tab === "episodes" ? "active" : ""}
            aria-pressed={tab === "episodes"}
            onClick={() => setTab("episodes")}
          >
            {title.type === "Anime" ? "Episodes" : "Watch the movie"}
            <span>{getEpisodes(title).length}</span>
          </button>
          <button
            className={tab === "about" ? "active" : ""}
            aria-pressed={tab === "about"}
            onClick={() => setTab("about")}
          >
            About this title
          </button>
        </div>
        {tab === "episodes" ? (
          <section className="episodes-section">
            <div className="episode-section-heading">
              <div>
                <p className="eyebrow">
                  {title.type === "Anime"
                    ? "CHOOSE YOUR CHAPTER"
                    : "LIGHTS DOWN. STORY ON."}
                </p>
                <h2>
                  {title.type === "Anime"
                    ? "The story starts here."
                    : "Your movie is ready."}
                </h2>
              </div>
              {seasons && (
                <label className="season-select">
                  <span className="sr-only">Choose season</span>
                  <select
                    aria-label="Choose season"
                    value={season?.id}
                    onChange={(event) => setParam("season", event.target.value)}
                  >
                    {seasons.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </label>
              )}
            </div>
            <div className="episode-tools">
              <p>
                <strong>{available}</strong>{" "}
                {available === 1 ? "episode" : "episodes"} available{" "}
                <span>of {episodes.length}</span>
              </p>
              {seasons && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(event) =>
                      setParam("available", event.target.checked ? "1" : "")
                    }
                  />
                  <span>Available episodes only</span>
                </label>
              )}
            </div>
            <div className="episode-list">
              {visibleEpisodes.map((episode) => (
                <EpisodeRow key={episode.id} title={title} episode={episode} />
              ))}
            </div>
            {!visibleEpisodes.length && (
              <EmptyState
                icon={<Clock3 size={28} />}
                title="This season is still on the horizon."
                description="There are no available episodes in this season yet. Explore another season or see the full episode lineup."
              >
                <button
                  className="button button-secondary"
                  onClick={() => setParam("available", "")}
                >
                  Show all episodes
                </button>
              </EmptyState>
            )}
            {!playable && !onlyAvailable && (
              <p className="availability-footnote">
                <Clock3 size={15} />
                There’s no confirmed availability date for this season yet.
              </p>
            )}
          </section>
        ) : (
          <section className="about-title">
            <div>
              <p className="eyebrow">THE STORY</p>
              <h2>A world worth stepping into.</h2>
              <p>{title.description}</p>
            </div>
            <dl>
              <div>
                <dt>Format</dt>
                <dd>{formatType(title)}</dd>
              </div>
              <div>
                <dt>Release year</dt>
                <dd>{title.year}</dd>
              </div>
              <div>
                <dt>Genre</dt>
                <dd>{title.genre}</dd>
              </div>
              <div>
                <dt>{title.type === "Anime" ? "Episodes" : "Runtime"}</dt>
                <dd>
                  {title.type === "Anime"
                    ? `${getEpisodes(title).length} total · ${availableCount(title)} available`
                    : title.runtime}
                </dd>
              </div>
            </dl>
          </section>
        )}
        <section className="related-section">
          <SectionHeading
            eyebrow="KEEP EXPLORING"
            title="Your story doesn’t end here."
            href="/catalog"
            action="Explore all"
          />
          <div className="poster-grid related-grid">
            {related.map((item) => (
              <TitleCard key={item.id} title={item} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function Watch({
  title,
  episodeId,
}: {
  title: Title;
  episodeId?: string;
}) {
  const episodes = getEpisodes(title);
  const episode = episodeId
    ? episodes.find((item) => item.id === episodeId)
    : firstPlayable(title);
  const { remember } = useLibrary();
  const playback = usePlayback(title.id, episode?.id);
  const started = playback.status === "ready";
  const resolving = playback.status === "loading";
  const [cinema, setCinema] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const currentIndex = episodes.findIndex((item) => item.id === episode?.id);
  const previous = episodes.slice(0, currentIndex).reverse().find(isPlayable);
  const next = episodes.slice(currentIndex + 1).find(isPlayable);
  const currentSeason = title.seasons?.find(
    (season) => season.id === episode?.seasonId,
  );
  const [seasonId, setSeasonId] = useState(
    currentSeason?.id ?? title.seasons?.[0]?.id,
  );
  const displayedSeason = title.seasons?.find(
    (season) => season.id === seasonId,
  );
  useEffect(() => {
    if (!started || frameLoaded) return;
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [started, frameLoaded, reloadKey]);
  useEffect(() => {
    if (!cinema) return;
    const exitCinema = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCinema(false);
    };
    window.addEventListener("keydown", exitCinema);
    return () => window.removeEventListener("keydown", exitCinema);
  }, [cinema]);
  if (!episode)
    return (
      <NotFound
        title="We couldn’t find that episode."
        description="The episode address may have changed. Head back to the title to choose an available chapter."
        href={titlePath(title)}
        action="View all episodes"
      />
    );
  const playable = isPlayable(episode);
  const start = async () => {
    setFrameLoaded(false);
    setSlow(false);
    setReloadKey((key) => key + 1);
    if (await playback.resolve()) remember(title.id, episode.id);
  };
  return (
    <div className="page-container watch-page">
      <Breadcrumbs
        items={[
          { label: shortTitle(title), href: titlePath(title) },
          {
            label:
              title.type === "Movie"
                ? "Watch movie"
                : `Episode ${episode.number}`,
          },
        ]}
      />
      <div className="watch-title-row">
        <div>
          <p className="eyebrow">
            {title.type === "Movie"
              ? "FEATURE PRESENTATION"
              : currentSeason?.label}
          </p>
          <h1>{shortTitle(title)}</h1>
          {title.type === "Anime" && (
            <p className="watch-episode-title">
              E{String(episode.number).padStart(2, "0")}
              <span>—</span>
              {episode.title}
            </p>
          )}
        </div>
        <SaveButton title={title} />
      </div>
      <div className={`watch-layout ${cinema ? "cinema-mode" : ""}`}>
        <div className="watch-main">
          <div className={`player-shell ${started ? "is-playing" : ""}`}>
            {playable ? (
              started ? (
                <>
                  <iframe
                    key={reloadKey}
                    src={playback.source}
                    title={`${title.title} — ${episode.title} player`}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setFrameLoaded(true)}
                  />
                  {!frameLoaded && (
                    <div className="player-loading" role="status">
                      <span className="spinner" />
                      Opening the video service…
                    </div>
                  )}
                </>
              ) : playback.status === "error" ? (
                <div className="playback-error">
                  <EmptyState
                    icon={<AlertCircle size={30} />}
                    title="A brief intermission."
                    description={playback.error}
                  >
                    <button
                      className="button button-primary"
                      onClick={() => void start()}
                    >
                      <RotateCcw size={16} />
                      Try again
                    </button>
                  </EmptyState>
                </div>
              ) : (
                <div
                  className={`player-start ${resolving ? "is-resolving" : ""}`}
                >
                  <img src={currentSeason?.image ?? title.image} alt="" />
                  <div className="player-start-shade" />
                  <div className="player-start-content">
                    <span className="outline-tag">
                      {title.type === "Movie"
                        ? "FEATURE FILM"
                        : `EPISODE ${String(episode.number).padStart(2, "0")}`}
                    </span>
                    <button
                      className="big-play"
                      onClick={() => void start()}
                      disabled={resolving}
                      aria-busy={resolving}
                      aria-label={`Play ${episode.title}`}
                    >
                      {resolving ? (
                        <span className="spinner" />
                      ) : (
                        <Play size={29} fill="currentColor" />
                      )}
                    </button>
                    <h2>
                      {title.type === "Movie"
                        ? "Your movie night starts here."
                        : episode.title}
                    </h2>
                    <p role="status">
                      {resolving
                        ? "Preparing your player…"
                        : "Get comfortable. Press play."}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <EmptyState
                icon={<Clock3 size={32} />}
                title="A chapter for another day."
                description="This episode isn’t available yet. There’s plenty more to explore in the meantime."
              >
                <Link className="button button-primary" href={titlePath(title)}>
                  Find an available episode
                  <ArrowRight size={16} />
                </Link>
              </EmptyState>
            )}
          </div>
          <div className="player-toolbar">
            <span className={`player-status ${playable ? "ready" : ""}`}>
              <span className="live-dot" />
              {!playable
                ? "Not available yet"
                : resolving
                  ? "Preparing player…"
                  : playback.status === "error"
                    ? "Player unavailable"
                    : !started
                      ? "Ready when you are"
                      : frameLoaded
                        ? "External video player"
                        : "Opening video service…"}
            </span>
            <div>
              <button
                className="utility-button cinema-toggle"
                aria-pressed={cinema}
                onClick={() => setCinema(!cinema)}
              >
                {cinema ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {cinema ? "Exit cinema" : "Cinema mode"}
              </button>
              {started && (
                <button className="utility-button" onClick={() => void start()}>
                  <RotateCcw size={14} />
                  Reload player
                </button>
              )}
              <button
                className="utility-button"
                aria-expanded={showHelp}
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle size={15} />
                Playback help
              </button>
            </div>
          </div>
          {slow && !frameLoaded && (
            <div className="playback-notice" role="status">
              The player is taking longer than expected. Try reloading it or
              checking your connection.
            </div>
          )}
          {showHelp && (
            <div className="playback-help">
              <h3>A little help getting started.</h3>
              <p>
                Check your connection or reload the player. Quality, subtitles,
                and playback controls are provided by the video service.
              </p>
              <Link href="/help" className="text-link">
                More playback information
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {title.type === "Anime" && (
            <div className="episode-navigation">
              {previous ? (
                <Link href={watchPath(title, previous.id)}>
                  <ChevronLeft size={20} />
                  <span>
                    <small>PREVIOUS AVAILABLE</small>
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <span className="episode-nav-start">
                  You’re at the beginning.
                </span>
              )}
              {next ? (
                <Link href={watchPath(title, next.id)} className="next-episode">
                  <span>
                    <small>NEXT AVAILABLE</small>
                    {next.title}
                  </span>
                  <ChevronRight size={20} />
                </Link>
              ) : (
                <span className="episode-nav-start">
                  You’ve reached the latest available episode.
                </span>
              )}
            </div>
          )}
          <div className="watch-description">
            <div>
              <p className="eyebrow">
                ABOUT {title.type === "Movie" ? "THE MOVIE" : "THIS EPISODE"}
              </p>
              <h2>{episode.title}</h2>
              <p>
                {episode.description}
              </p>
            </div>
            <span>
              <Clock3 size={15} />
              {episode.duration}
            </span>
          </div>
          <p className="provider-note">
            Playback opens an external video service. Availability and player
            features may vary. If the player is blank or shows an error, reload
            it or try another episode.
          </p>
        </div>
        <aside
          className="watch-sidebar"
          aria-label={
            title.type === "Anime" ? "Episode selection" : "More to discover"
          }
        >
          {title.type === "Anime" ? (
            <>
              <div className="sidebar-heading">
                <h2>Episodes</h2>
                <span>{availableCount(title)} available</span>
              </div>
              {title.seasons && (
                <label className="season-select">
                  <span className="sr-only">Player season</span>
                  <select
                    aria-label="Player season"
                    value={seasonId}
                    onChange={(event) => setSeasonId(event.target.value)}
                  >
                    {title.seasons.map((season) => (
                      <option value={season.id} key={season.id}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
              )}
              <div className="sidebar-episodes">
                {(displayedSeason?.episodes ?? episodes).map((item) => (
                  <EpisodeRow
                    key={item.id}
                    title={title}
                    episode={item}
                    selected={item.id === episode.id}
                  />
                ))}
              </div>
              <Link
                className="text-link sidebar-bottom-link"
                href={titlePath(title)}
              >
                View title details
                <ArrowUpRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <div className="sidebar-heading">
                <h2>Keep the night going</h2>
              </div>
              {titles
                .filter((item) => item.type === "Movie" && item.id !== title.id)
                .map((item) => (
                  <Link
                    key={item.id}
                    className="sidebar-movie"
                    href={titlePath(item)}
                  >
                    <img src={item.image} alt="" />
                    <span>
                      <small>{item.year} · Movie</small>
                      <strong>{shortTitle(item)}</strong>
                      <span>
                        Explore title
                        <ArrowUpRight size={13} />
                      </span>
                    </span>
                  </Link>
                ))}
              <Link href="/movies" className="text-link sidebar-bottom-link">
                All movies
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function HistoryCards({ limit }: { limit?: number }) {
  const { history, removeHistory } = useLibrary();
  return (
    <div className="history-grid">
      {history.slice(0, limit).map((entry) => {
        const title = findTitle(entry.titleId)!;
        const episode = getEpisodes(title).find(
          (item) => item.id === entry.episodeId,
        )!;
        const season = title.seasons?.find(
          (item) => item.id === episode.seasonId,
        );
        return (
          <article className="history-card" key={entry.titleId}>
            <Link
              className="history-art"
              href={watchPath(title, episode.id)}
              aria-label={`Open ${episode.title}`}
            >
              <img src={season?.image ?? title.image} alt="" />
              <span>
                <Play size={20} fill="currentColor" />
              </span>
            </Link>
            <div>
              <p className="eyebrow">
                {title.type === "Movie"
                  ? "MOVIE"
                  : `${season?.label.split(" · ")[0] ?? "Series"} · E${String(episode.number).padStart(2, "0")}`}
              </p>
              <h3>
                <Link href={watchPath(title, episode.id)}>
                  {shortTitle(title)}
                </Link>
              </h3>
              <p>{title.type === "Movie" ? title.runtime : episode.title}</p>
              <Link href={watchPath(title, episode.id)} className="text-link">
                {title.type === "Movie" ? "Open movie" : "Open episode"}
                <ArrowRight size={14} />
              </Link>
            </div>
            <button
              className="icon-button history-remove"
              aria-label={`Remove ${shortTitle(title)} from recently opened`}
              onClick={() => removeHistory(title.id)}
            >
              <X size={16} />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export function Watchlist() {
  const { saved, history } = useLibrary();
  const { url } = useNavigation();
  const historyTab = url.searchParams.get("tab") === "history";
  const savedTitles = saved.map((id) => findTitle(id)!).reverse();
  return (
    <div className="page-container library-page">
      <PageHeading
        eyebrow="YOUR OWN LITTLE CORNER"
        title="Good stories, kept close"
        description="A place for the worlds you’re saving for later, and the ones you’ve already stepped into."
      />
      <nav className="library-tabs" aria-label="Your library">
        <Link href="/watchlist" className={!historyTab ? "active" : ""}>
          <Bookmark size={17} />
          My watchlist<span>{saved.length}</span>
        </Link>
        <Link
          href="/watchlist?tab=history"
          className={historyTab ? "active" : ""}
        >
          <Clock3 size={17} />
          Recently opened<span>{history.length}</span>
        </Link>
      </nav>
      {historyTab ? (
        history.length ? (
          <>
            <p className="library-note">
              The last episode you opened for each title. Playback position is
              managed by the video provider.
            </p>
            <HistoryCards />
          </>
        ) : (
          <EmptyState
            icon={<Play size={30} />}
            title="Your first adventure is waiting."
            description="Once you open a player, you’ll find that title here. A little breadcrumb trail through your favorite worlds."
          >
            <Link href="/catalog" className="button button-primary">
              Find something to watch
              <ArrowRight size={16} />
            </Link>
          </EmptyState>
        )
      ) : savedTitles.length ? (
        <>
          <p className="library-note">
            Saved for a good night in. Use the checkmark on a title to remove
            it.
          </p>
          <div className="poster-grid browse-grid">
            {savedTitles.map((title) => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Bookmark size={32} />}
          title="An empty list. Endless possibilities."
          description="See something that catches your eye? Tap the + on any title to save it for a future movie night."
        >
          <Link href="/catalog" className="button button-primary">
            Discover your next favorite
            <ArrowRight size={16} />
          </Link>
        </EmptyState>
      )}
      <div className="storage-note">
        <ShieldCheck size={18} />
        <p>
          Just for you, on this device.
          <span>Your list stays in this browser. No account required.</span>
        </p>
        <Link href="/help#privacy">
          How it works
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function Help() {
  const { url } = useNavigation();
  return (
    <div className="page-container help-page">
      <PageHeading
        eyebrow="A LITTLE GUIDANCE"
        title="Let’s get you watching"
        description="Everything you need to find a story, save your favorites, and settle in."
      />
      <div className="help-layout">
        <aside className="help-intro">
          <div className="help-symbol">
            <HelpCircle size={34} strokeWidth={1.3} />
          </div>
          <h2>
            Less wondering.
            <br />
            More watching.
          </h2>
          <p>
            Start with the questions here, or head straight into a new world.
          </p>
          <Link href="/catalog" className="text-link">
            Explore the catalog
            <ArrowRight size={16} />
          </Link>
          <div className="help-shortcut">
            <kbd>/</kbd>
            <span>Press slash anywhere to search.</span>
          </div>
        </aside>
        <section className="faq-list" aria-label="Frequently asked questions">
          {faqs.map((faq, index) => (
            <details
              key={`${index}-${url.hash}`}
              id={index === 5 ? "privacy" : undefined}
              tabIndex={index === 5 ? -1 : undefined}
              open={index === 5 && url.hash === "#privacy" ? true : undefined}
            >
              <summary>
                <span className="faq-number">0{index + 1}</span>
                <span>{faq.question}</span>
                <ChevronDown size={18} />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      </div>
      <div className="help-closing">
        <span className="small-star">✳</span>
        <h2>Your next favorite is one play away.</h2>
        <Link href="/collections" className="button button-secondary">
          Find some inspiration
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}

export function NotFound({
  title = "This story took a wrong turn.",
  description = "The page you’re looking for isn’t here. Let’s find a world that is.",
  href = "/catalog",
  action = "Back to exploring",
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="page-container not-found">
      <span className="not-found-code">
        404<span>LOST IN ANOTHER DIMENSION</span>
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href={href} className="button button-primary">
        {action}
        <ArrowRight size={17} />
      </Link>
      <Link href="/" className="text-link">
        Or head home
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
