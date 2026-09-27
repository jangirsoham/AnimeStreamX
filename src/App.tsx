import { ArrowLeft, Bookmark, Check, ChevronRight, Clock3, Menu, Play, Search, Star, X } from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';

type MediaType = 'Movie' | 'Anime';
type View = 'home' | 'catalog' | 'detail' | 'watch';

type Episode = {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  source: string;
};

type Title = {
  id: string;
  title: string;
  type: MediaType;
  year: string;
  rating: string;
  genre: string;
  runtime: string;
  description: string;
  image: string;
  featured?: boolean;
  episodes?: Episode[];
};

const images = {
  jjk0: '/posters/jujutsu-kaisen-0.jpg',
  castle: '/posters/infinity-castle.jpg',
  city: '/posters/jujutsu-kaisen-season-1.webp',
};

const titles: Title[] = [
  {
    id: 'jujutsu-kaisen-0',
    title: 'Jujutsu Kaisen 0',
    type: 'Movie',
    year: '2021',
    rating: '8.6',
    genre: 'Supernatural',
    runtime: '1h 45m',
    description: 'Yuta Okkotsu is haunted by the spirit of his childhood friend. At Tokyo Jujutsu High, he learns to control the curse and fight beside other sorcerers.',
    image: images.jjk0,
    featured: true,
    episodes: [{ id: 'movie', number: 1, title: 'Jujutsu Kaisen 0', description: 'Feature film', duration: '1h 45m', source: 'https://player.abyssplayer.com/7g7skNfX5' }],
  },
  {
    id: 'infinity-castle',
    title: 'Infinity Castle',
    type: 'Movie',
    year: '2025',
    rating: '9.1',
    genre: 'Dark fantasy',
    runtime: '2h 16m',
    description: 'The Demon Slayer Corps enters Muzan Kibutsuji’s shifting fortress for a final battle where every room changes the fight.',
    image: images.castle,
    episodes: [{ id: 'movie', number: 1, title: 'Infinity Castle', description: 'Feature film', duration: '2h 16m', source: 'https://player.abyssplayer.com/r9txDiZ44' }],
  },
  {
    id: 'jujutsu-kaisen-season-1',
    title: 'Jujutsu Kaisen',
    type: 'Anime',
    year: '2020',
    rating: '8.7',
    genre: 'Action',
    runtime: 'Season 1',
    description: 'Yuji Itadori joins Tokyo Jujutsu High after swallowing a cursed finger and becoming the vessel of Ryomen Sukuna.',
    image: images.city,
    episodes: [
      { id: 'episode-1', number: 1, title: 'Ryomen Sukuna', description: 'Yuji discovers a cursed finger and makes a dangerous choice.', duration: '23m', source: 'https://player.abyssplayer.com/pkhwA062-' },
      { id: 'episode-2', number: 2, title: 'For Myself', description: 'Yuji wakes up at Tokyo Jujutsu High and learns the cost of his decision.', duration: '23m', source: 'https://player.abyssplayer.com/B3loa0wwQ' },
    ],
  },
];

const featured = titles.find((title) => title.featured) ?? titles[0];
const movieTitles = titles.filter((title) => title.type === 'Movie');
const animeTitles = titles.filter((title) => title.type === 'Anime');

function pathFor(view: View, id?: string, episodeId?: string) {
  if (view === 'home') return '/';
  if (view === 'catalog') return '/catalog';
  if (view === 'detail') return `/title/${id}`;
  return `/watch/${id}/${episodeId}`;
}

function readLocation(): { view: View; id?: string; episodeId?: string } {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (!segments.length) return { view: 'home' };
  if (segments[0] === 'catalog') return { view: 'catalog' };
  if (segments[0] === 'title' && segments[1]) return { view: 'detail', id: segments[1] };
  if (segments[0] === 'watch' && segments[1]) return { view: 'watch', id: segments[1], episodeId: segments[2] };
  return { view: 'home' };
}

function App() {
  const [location, setLocation] = useState(readLocation);
  const [saved, setSaved] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setLocation(readLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setLocation(readLocation());
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSaved = (id: string) => {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const activeTitle = titles.find((title) => title.id === location.id) ?? featured;

  return (
    <div className="app-shell">
      <Header location={location} menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} />
      {location.view === 'home' && <Home navigate={navigate} saved={saved} toggleSaved={toggleSaved} />}
      {location.view === 'catalog' && <Catalog key={window.location.search} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />}
      {location.view === 'detail' && <Detail title={activeTitle} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />}
      {location.view === 'watch' && <Watch title={activeTitle} episodeId={location.episodeId} navigate={navigate} />}
      {location.view !== 'watch' && <Footer />}
    </div>
  );
}

function Header({ location, menuOpen, setMenuOpen, navigate }: { location: { view: View }; menuOpen: boolean; setMenuOpen: (value: boolean) => void; navigate: (path: string) => void }) {
  const queryType = new URLSearchParams(window.location.search).get('type');
  const isActive = (path: string) => path === '/' ? location.view === 'home' : location.view !== 'home' && (path === '/catalog' || location.view === 'catalog' || location.view === 'detail');

  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate('/')} aria-label="Go to AnimStreamX home">
        <span className="brand-mark">AX</span>
        <span>AnimStreamX</span>
      </button>
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>Home</button>
        <button className={`nav-link ${queryType === 'Movie' ? 'active' : ''}`} onClick={() => navigate('/catalog?type=Movie')}>Movies</button>
        <button className={`nav-link ${queryType === 'Anime' ? 'active' : ''}`} onClick={() => navigate('/catalog?type=Anime')}>Anime</button>
      </nav>
      <div className="header-actions">
        <button className="search-link" onClick={() => navigate('/catalog')}><Search size={17} /> <span>Search</span></button>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
    </header>
  );
}

function Home({ navigate, saved, toggleSaved }: { navigate: (path: string) => void; saved: string[]; toggleSaved: (id: string) => void }) {
  return (
    <main className="page home-page">
      <section className="hero" style={{ backgroundImage: `url(${featured.image})` }}>
        <div className="hero-content">
          <p className="eyebrow">Featured movie</p>
          <h1>{featured.title}</h1>
          <div className="hero-meta"><span>{featured.year}</span><span>{featured.genre}</span><span>{featured.runtime}</span><span><Star size={13} fill="currentColor" /> {featured.rating}</span></div>
          <p className="hero-copy">{featured.description}</p>
          <div className="button-row">
            <button className="button button-primary" onClick={() => navigate(pathFor('watch', featured.id, featured.episodes?.[0].id))}><Play size={16} fill="currentColor" /> Play</button>
            <button className="button button-secondary" onClick={() => navigate(pathFor('detail', featured.id))}>More info</button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <SectionHeading title="Featured" action="View all" onAction={() => navigate('/catalog')} />
        <div className="featured-strip">
          <TitleCard title={featured} navigate={navigate} saved={saved} toggleSaved={toggleSaved} featuredCard />
          <div className="featured-details">
            <p className="eyebrow">About this title</p>
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <button className="text-link" onClick={() => navigate(pathFor('detail', featured.id))}>View title details <ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      <section className="content-section section-alt">
        <SectionHeading title="Movies" action="Browse movies" onAction={() => navigate('/catalog?type=Movie')} />
        <div className="card-grid movie-grid">
          {movieTitles.map((title) => <TitleCard key={title.id} title={title} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />)}
        </div>
      </section>

      <section className="content-section">
        <SectionHeading title="Anime" action="Browse anime" onAction={() => navigate('/catalog?type=Anime')} />
        <div className="card-grid anime-grid">
          {animeTitles.map((title) => <TitleCard key={title.id} title={title} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />)}
        </div>
      </section>

      <section className="content-section section-alt">
        <SectionHeading title="Continue watching" />
        <ContinueWatching navigate={navigate} />
      </section>
    </main>
  );
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action && onAction && <button className="text-link" onClick={onAction}>{action} <ChevronRight size={15} /></button>}
    </div>
  );
}

function ContinueWatching({ navigate }: { navigate: (path: string) => void }) {
  return (
    <article className="continue-card">
      <img src={images.city} alt="Jujutsu Kaisen artwork" />
      <div className="continue-content">
        <span className="continue-label">Jujutsu Kaisen · Episode 2</span>
        <h3>For Myself</h3>
        <p>Episode 2 of Season 1</p>
        <div className="progress-track" aria-label="60 percent watched"><span /></div>
        <div className="continue-meta"><span>14m watched</span><span>23m total</span></div>
        <button className="button button-primary compact-button" onClick={() => navigate(pathFor('watch', 'jujutsu-kaisen-season-1', 'episode-2'))}><Play size={15} fill="currentColor" /> Continue</button>
      </div>
    </article>
  );
}

function Catalog({ navigate, saved, toggleSaved }: { navigate: (path: string) => void; saved: string[]; toggleSaved: (id: string) => void }) {
  const initialFilter = new URLSearchParams(window.location.search).get('type');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | MediaType>(initialFilter === 'Movie' || initialFilter === 'Anime' ? initialFilter : 'All');
  const visibleTitles = useMemo(() => titles.filter((title) => {
    const matchesType = filter === 'All' || title.type === filter;
    const matchesQuery = `${title.title} ${title.genre}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesType && matchesQuery;
  }), [filter, query]);
  const movies = visibleTitles.filter((title) => title.type === 'Movie');
  const anime = visibleTitles.filter((title) => title.type === 'Anime');

  return (
    <main className="page catalog-page">
      <div className="catalog-intro">
        <div><p className="eyebrow">Browse library</p><h1>Catalog</h1></div>
        <p>{titles.length} titles available to watch.</p>
      </div>
      <div className="catalog-controls">
        <label className="search-wrap"><Search size={17} /><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or genres" aria-label="Search titles or genres" /></label>
        <div className="filter-group" aria-label="Filter titles">
          {(['All', 'Movie', 'Anime'] as const).map((item) => <button key={item} className={`filter-button ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item === 'Movie' ? 'Movies' : item}</button>)}
        </div>
      </div>
      {visibleTitles.length ? <>
        {movies.length > 0 && <CatalogGroup heading="Movies" count={movies.length} titles={movies} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />}
        {anime.length > 0 && <CatalogGroup heading="Anime" count={anime.length} titles={anime} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />}
      </> : <div className="empty-state"><h3>No titles found</h3><p>Try another title, genre, or filter.</p><button className="button button-primary" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button></div>}
    </main>
  );
}

function CatalogGroup({ heading, count, titles: groupTitles, navigate, saved, toggleSaved }: { heading: string; count: number; titles: Title[]; navigate: (path: string) => void; saved: string[]; toggleSaved: (id: string) => void }) {
  return <section className="catalog-group"><div className="group-heading"><h2>{heading}</h2><span>{count} {count === 1 ? 'title' : 'titles'}</span></div><div className="card-grid">{groupTitles.map((title) => <TitleCard key={title.id} title={title} navigate={navigate} saved={saved} toggleSaved={toggleSaved} />)}</div></section>;
}

function TitleCard({ title, navigate, saved, toggleSaved, featuredCard = false }: { title: Title; navigate: (path: string) => void; saved: string[]; toggleSaved: (id: string) => void; featuredCard?: boolean }) {
  const isSaved = saved.includes(title.id);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(pathFor('detail', title.id));
    }
  };

  return (
    <article className={`media-card ${featuredCard ? 'featured-card' : ''}`} onClick={() => navigate(pathFor('detail', title.id))} onKeyDown={handleKeyDown} tabIndex={0} role="link">
      <div className="poster"><img src={title.image} alt={`${title.title} artwork`} /><span className="poster-type">{title.type}</span><button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); toggleSaved(title.id); }} aria-label={isSaved ? `Remove ${title.title} from saved` : `Save ${title.title}`}><Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} /></button></div>
      <div className="card-body"><h3>{title.title}</h3><div className="card-info"><span>{title.year} · {title.genre}</span><strong><Star size={12} fill="currentColor" /> {title.rating}</strong></div></div>
    </article>
  );
}

function Detail({ title, navigate, saved, toggleSaved }: { title: Title; navigate: (path: string) => void; saved: string[]; toggleSaved: (id: string) => void }) {
  const playableEpisode = title.episodes?.[0];
  const isSaved = saved.includes(title.id);
  return (
    <main className="page detail-page">
      <section className="detail-hero">
        <div className="detail-poster"><img src={title.image} alt={`${title.title} key art`} /></div>
        <div className="detail-copy">
          <button className="back-button" onClick={() => navigate('/catalog')}><ArrowLeft size={15} /> Back to catalog</button>
          <p className="eyebrow">{title.type} · {title.genre}</p>
          <h1>{title.title}</h1>
          <p className="detail-description">{title.description}</p>
          <div className="detail-stats"><span>{title.year}</span><span><Star size={12} fill="currentColor" /> {title.rating}</span><span>{title.runtime}</span></div>
          <div className="button-row"><button className="button button-primary" onClick={() => playableEpisode && navigate(pathFor('watch', title.id, playableEpisode.id))}><Play size={16} fill="currentColor" /> {title.type === 'Movie' ? 'Play movie' : 'Play episode 1'}</button><button className="button button-secondary" onClick={() => toggleSaved(title.id)}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save title'}</button></div>
        </div>
      </section>
      {title.episodes && <section className="episodes-section"><SectionHeading title={title.type === 'Movie' ? 'Movie' : 'Episodes'} /><div className="episode-list">{title.episodes.map((episode) => <button className="episode-item" key={episode.id} onClick={() => navigate(pathFor('watch', title.id, episode.id))}><span className="episode-number">{title.type === 'Movie' ? <Play size={14} fill="currentColor" /> : String(episode.number).padStart(2, '0')}</span><span className="episode-copy"><h3>{episode.title}</h3><p>{episode.description}</p></span><span className="episode-duration"><Clock3 size={14} /> {episode.duration} <ChevronRight size={15} /></span></button>)}</div></section>}
    </main>
  );
}

function Watch({ title, episodeId, navigate }: { title: Title; episodeId?: string; navigate: (path: string) => void }) {
  const episode = title.episodes?.find((item) => item.id === episodeId) ?? title.episodes?.[0];
  const nextEpisode = title.episodes?.find((item) => item.number === (episode?.number ?? 0) + 1);
  return (
    <main className="page watch-page">
      <div className="watch-header"><div><button className="back-button" onClick={() => navigate(pathFor('detail', title.id))}><ArrowLeft size={15} /> Back to title</button><h1>{title.title}{title.type === 'Anime' && episode ? ` · ${episode.number}. ${episode.title}` : ''}</h1><p className="watch-subtitle">{title.type === 'Movie' ? 'Movie' : `Season 1 · Episode ${String(episode?.number ?? 1)}`}</p></div><button className="button button-secondary" onClick={() => navigate('/catalog')}>Browse catalog</button></div>
      <div className="player-shell">{episode ? <iframe src={episode.source} title={`${title.title} player`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <div className="empty-state"><h3>Playback unavailable</h3><p>This title does not have a playable episode yet.</p></div>}</div>
      <div className="player-note"><span><Check size={14} /> Playback source ready</span><span>{episode?.duration}</span></div>
      {nextEpisode && <section className="next-up"><SectionHeading title="Next episode" /><button className="next-card" onClick={() => navigate(pathFor('watch', title.id, nextEpisode.id))}><img src={title.image} alt="" /><div><span>Episode {String(nextEpisode.number).padStart(2, '0')}</span><h3>{nextEpisode.title}</h3></div><ChevronRight size={17} /></button></section>}
    </main>
  );
}

function Footer() {
  return <footer className="footer"><span>AnimStreamX</span><span>Movies and anime, ready to watch.</span></footer>;
}

export default App;