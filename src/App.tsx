import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Heart, Menu, Play, Search, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  accent: string;
  featured?: boolean;
  episodes?: Episode[];
};

const images = {
  jjk0: 'https://images.pexels.com/photos/2113566/pexels-photo-2113566.jpeg?auto=compress&cs=tinysrgb&w=1100',
  castle: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=1100',
  city: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1100',
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
    description: 'Before Yuji, there was Yuta. A haunted teenager inherits a promise, a curse, and a place at Tokyo Jujutsu High. The prequel that hits like a final act.',
    image: images.jjk0,
    accent: 'coral',
    featured: true,
    episodes: [{ id: 'movie', number: 1, title: 'Jujutsu Kaisen 0', description: 'The feature presentation.', duration: '1h 45m', source: 'https://player.abyssplayer.com/7g7skNfX5' }],
  },
  {
    id: 'infinity-castle',
    title: 'Infinity Castle',
    type: 'Movie',
    year: '2025',
    rating: '9.1',
    genre: 'Dark fantasy',
    runtime: '2h 16m',
    description: 'The doors close. The strongest slayers drop into Muzan’s impossible fortress, where every room is a trap and every breath costs something.',
    image: images.castle,
    accent: 'teal',
    episodes: [{ id: 'movie', number: 1, title: 'Infinity Castle', description: 'The feature presentation.', duration: '2h 16m', source: 'https://player.abyssplayer.com/r9txDiZ44' }],
  },
  {
    id: 'jujutsu-kaisen-season-1',
    title: 'Jujutsu Kaisen',
    type: 'Anime',
    year: '2020',
    rating: '8.7',
    genre: 'Action',
    runtime: '24 episodes',
    description: 'Yuji Itadori has the strength to change everything. The only problem: a cursed spirit is living inside him, and it wants out.',
    image: images.city,
    accent: 'yellow',
    episodes: [
      { id: 'episode-1', number: 1, title: 'Ryomen Sukuna', description: 'A strange finger. A dangerous choice. An ordinary afternoon ends with a curse.', duration: '23m', source: 'https://player.abyssplayer.com/pkhwA062-' },
      { id: 'episode-2', number: 2, title: 'For Myself', description: 'Yuji wakes up in a room he does not recognize and meets the people who have already decided his fate.', duration: '23m', source: 'https://player.abyssplayer.com/B3loa0wwQ' },
    ],
  },
];

const featured = titles.find((title) => title.featured) ?? titles[0];
const animeTitles = titles.filter((title) => title.type === 'Anime');
const movieTitles = titles.filter((title) => title.type === 'Movie');

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
  const [liked, setLiked] = useState<string[]>([]);
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

  const toggleLike = (id: string) => {
    setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const activeTitle = titles.find((title) => title.id === location.id) ?? featured;

  return (
    <div className="app-shell">
      <Header location={location} menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} />
      {location.view === 'home' && <Home navigate={navigate} liked={liked} toggleLike={toggleLike} />}
      {location.view === 'catalog' && <Catalog navigate={navigate} liked={liked} toggleLike={toggleLike} />}
      {location.view === 'detail' && <Detail title={activeTitle} navigate={navigate} liked={liked} toggleLike={toggleLike} />}
      {location.view === 'watch' && <Watch title={activeTitle} episodeId={location.episodeId} navigate={navigate} />}
      {location.view !== 'watch' && <Footer />}
    </div>
  );
}

function Header({ location, menuOpen, setMenuOpen, navigate }: { location: { view: View }; menuOpen: boolean; setMenuOpen: (value: boolean) => void; navigate: (path: string) => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate('/')} aria-label="Go to AnimStreamX home">
        <span className="brand-mark">AX</span>
        <span>AnimStreamX</span>
      </button>
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <button className={`nav-link ${location.view === 'home' ? 'active' : ''}`} onClick={() => navigate('/')}>Home</button>
        <button className={`nav-link ${location.view === 'catalog' || location.view === 'detail' ? 'active' : ''}`} onClick={() => navigate('/catalog')}>Catalog</button>
        <button className="nav-link" onClick={() => navigate('/catalog')}>New this week</button>
      </nav>
      <div className="header-actions">
        <button className="icon-button" onClick={() => navigate('/catalog')} aria-label="Search catalog"><Search size={17} strokeWidth={1.8} /></button>
        <button className="profile-chip" onClick={() => navigate('/')} aria-label="Open profile">R</button>
        <button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={18} /></button>
      </div>
    </header>
  );
}

function Home({ navigate, liked, toggleLike }: { navigate: (path: string) => void; liked: string[]; toggleLike: (id: string) => void }) {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Tonight's featured premiere</p>
          <h1>Stay up for<br /><em>the good part.</em></h1>
          <p className="hero-copy">A tight, hand-picked room for anime worth the late night. No endless scroll. Just the next scene you were looking for.</p>
          <div className="hero-meta"><span><strong>{featured.year}</strong> · feature</span><span><strong>8.6</strong> audience score</span><span><strong>1h 45m</strong></span></div>
          <div className="button-row">
            <button className="button button-primary" onClick={() => navigate(pathFor('watch', featured.id, featured.episodes?.[0].id))}><Play size={15} fill="currentColor" /> Watch now</button>
            <button className="button button-ghost" onClick={() => navigate(pathFor('detail', featured.id))}>View details <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="section-header">
          <div><p className="eyebrow">The small screen / big feeling edit</p><h2 className="section-title">Movies<br />after dark</h2><div className="title-underline" /></div>
          <p className="section-kicker">One night. One feature. Lights down, volume up.</p>
        </div>
        <div className="feature-split">
          <TitleCard title={featured} navigate={navigate} liked={liked} toggleLike={toggleLike} feature />
          <div className="feature-note"><p>Good stories leave the room <span>different.</span></p></div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="section-header">
          <div><p className="eyebrow">Make it a series</p><h2 className="section-title">Anime<br />on repeat</h2><div className="title-underline" /></div>
          <p className="section-kicker dark-kicker">Start a new arc. Keep the old promises.</p>
        </div>
        <div className="catalog-grid">
          {animeTitles.slice(0, 3).map((title, index) => <TitleCard key={title.id} title={title} navigate={navigate} liked={liked} toggleLike={toggleLike} index={index + 1} />)}
        </div>
        <div className="continue-row">
          <div className="continue-art"><img src={images.city} alt="Night city lights" /></div>
          <div className="continue-copy">
            <p className="eyebrow">Continue watching</p>
            <h3>Jujutsu Kaisen<br />— episode 02</h3>
            <p>You left Yuji at the door. The curse is already inside.</p>
            <div className="progress-track"><span /></div>
            <div className="progress-meta"><span>14m watched</span><span>23m total</span></div>
            <div className="button-row" style={{ marginTop: 21 }}><button className="button button-primary" onClick={() => navigate(pathFor('watch', 'jujutsu-kaisen-season-1', 'episode-2'))}><Play size={15} fill="currentColor" /> Continue</button></div>
          </div>
        </div>
      </section>
      <section className="section section-cream">
        <div className="section-header"><div><p className="eyebrow">No algorithm required</p><h2 className="section-title">Find your<br />next obsession</h2></div><button className="button button-ghost" style={{ color: 'hsl(var(--ink))', borderColor: 'hsl(var(--ink) / .3)' }} onClick={() => navigate('/catalog')}>Open full catalog <ArrowRight size={15} /></button></div>
      </section>
    </main>
  );
}

function Catalog({ navigate, liked, toggleLike }: { navigate: (path: string) => void; liked: string[]; toggleLike: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | MediaType>('All');
  const visibleTitles = useMemo(() => titles.filter((title) => {
    const matchesType = filter === 'All' || title.type === filter;
    const matchesQuery = `${title.title} ${title.genre}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesType && matchesQuery;
  }), [filter, query]);
  const movies = visibleTitles.filter((title) => title.type === 'Movie');
  const anime = visibleTitles.filter((title) => title.type === 'Anime');

  return (
    <main className="catalog-page page">
      <div className="catalog-top"><div><p className="eyebrow">The whole room</p><h1>Pick a<br />side quest.</h1><div className="title-underline" /></div><p>Curated films and series for the exact mood you cannot quite name.</p></div>
      <div className="catalog-controls">
        <label className="search-wrap"><Search size={16} /><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, genres..." aria-label="Search titles" /></label>
        <SlidersHorizontal size={16} color="hsl(var(--ink) / .55)" />
        {(['All', 'Movie', 'Anime'] as const).map((item) => <button key={item} className={`filter-button ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item === 'Movie' ? 'Movies' : item === 'Anime' ? 'Anime' : item}</button>)}
      </div>
      {visibleTitles.length ? <>
        {movies.length > 0 && <CatalogGroup heading="Movies" count={movies.length} titles={movies} navigate={navigate} liked={liked} toggleLike={toggleLike} />}
        {anime.length > 0 && <CatalogGroup heading="Anime" count={anime.length} titles={anime} navigate={navigate} liked={liked} toggleLike={toggleLike} />}
      </> : <div className="empty-state"><h3>No signal found</h3><p>Try a different title or genre. The good part is still out there.</p><button className="button button-primary" onClick={() => { setQuery(''); setFilter('All'); }}>Reset search</button></div>}
    </main>
  );
}

function CatalogGroup({ heading, count, titles: groupTitles, navigate, liked, toggleLike }: { heading: string; count: number; titles: Title[]; navigate: (path: string) => void; liked: string[]; toggleLike: (id: string) => void }) {
  return <section className="catalog-group"><div className="group-heading"><h2>{heading}</h2><span>{String(count).padStart(2, '0')} titles</span></div><div className="catalog-grid">{groupTitles.map((title, index) => <TitleCard key={title.id} title={title} navigate={navigate} liked={liked} toggleLike={toggleLike} index={index + 1} />)}</div></section>;
}

function TitleCard({ title, navigate, liked, toggleLike, index, feature = false }: { title: Title; navigate: (path: string) => void; liked: string[]; toggleLike: (id: string) => void; index?: number; feature?: boolean }) {
  return <article className={`media-card ${feature ? 'feature-card' : ''}`} onClick={() => navigate(pathFor('detail', title.id))}>
    <div className="poster"><img src={title.image} alt={`${title.title} artwork`} /><span className="poster-number">{String(index ?? 1).padStart(2, '0')}</span><span className="card-tag">{title.type}</span></div>
    <div className="card-body"><h3>{title.title}</h3><div className="card-info"><span>{title.year} · {title.genre}</span><strong><Star size={11} fill="currentColor" /> {title.rating}</strong></div><button className="icon-button" onClick={(event) => { event.stopPropagation(); toggleLike(title.id); }} aria-label={liked.includes(title.id) ? `Remove ${title.title} from saved` : `Save ${title.title}`}><Heart size={16} fill={liked.includes(title.id) ? 'currentColor' : 'none'} /></button></div>
  </article>;
}

function Detail({ title, navigate, liked, toggleLike }: { title: Title; navigate: (path: string) => void; liked: string[]; toggleLike: (id: string) => void }) {
  const playableEpisode = title.episodes?.[0];
  return <main className="detail-page">
    <section className="detail-hero">
      <div className="detail-poster"><img src={title.image} alt={`${title.title} key art`} /></div>
      <div className="detail-copy">
        <button className="back-button" onClick={() => navigate('/catalog')}><ArrowLeft size={14} /> Back to catalog</button>
        <p className="eyebrow">{title.type} / {title.genre}</p>
        <h1>{title.title}</h1>
        <p className="detail-description">{title.description}</p>
        <div className="detail-stats"><span><strong>{title.year}</strong></span><span><strong>{title.rating}</strong> audience score</span><span><strong>{title.runtime}</strong></span></div>
        <div className="button-row"><button className="button button-primary" onClick={() => playableEpisode ? navigate(pathFor('watch', title.id, playableEpisode.id)) : undefined} disabled={!playableEpisode}><Play size={15} fill="currentColor" /> {title.type === 'Movie' ? 'Play movie' : 'Start episode 01'}</button><button className="button button-ghost" onClick={() => toggleLike(title.id)}><Heart size={15} fill={liked.includes(title.id) ? 'currentColor' : 'none'} /> {liked.includes(title.id) ? 'Saved' : 'Save title'}</button></div>
      </div>
    </section>
    {title.episodes && <section className="episodes-section"><p className="eyebrow">Choose your night</p><h2>{title.type === 'Movie' ? 'Feature presentation' : 'Episodes'}</h2><div className="episode-list">{title.episodes.map((episode) => <button className="episode-item" key={episode.id} onClick={() => navigate(pathFor('watch', title.id, episode.id))}><span className="episode-number">{String(episode.number).padStart(2, '0')}</span><span style={{ textAlign: 'left' }}><h3>{episode.title}</h3><p>{episode.description}</p></span><span className="episode-duration"><Clock3 size={13} /> {episode.duration} <ChevronRight size={14} /></span></button>)}</div></section>}
  </main>;
}

function Watch({ title, episodeId, navigate }: { title: Title; episodeId?: string; navigate: (path: string) => void }) {
  const episode = title.episodes?.find((item) => item.id === episodeId) ?? title.episodes?.[0];
  const nextEpisode = title.episodes?.find((item) => item.number === (episode?.number ?? 0) + 1);
  return <main className="watch-page page">
    <div className="watch-header"><div><button className="back-button" onClick={() => navigate(pathFor('detail', title.id))}><ArrowLeft size={14} /> Back to title</button><h1>{title.title}{title.type === 'Anime' && episode ? ` — ${episode.number}. ${episode.title}` : ''}</h1><p className="watch-subtitle">AnimStreamX player / {title.type === 'Movie' ? 'feature presentation' : `season 01 episode ${String(episode?.number ?? 1).padStart(2, '0')}`}</p></div><button className="button button-ghost" onClick={() => navigate('/catalog')}>Browse catalog <ArrowRight size={15} /></button></div>
    <div className="player-shell">{episode ? <iframe src={episode.source} title={`${title.title} player`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <div className="empty-state"><h3>Coming soon</h3><p>This title is queued for a future premiere.</p></div>}</div>
    <div className="player-note"><span><Check size={13} /> Playback source verified for this premiere</span><strong>Press play to enter</strong></div>
    {nextEpisode && <section className="next-up"><p className="eyebrow">Keep going</p><h2>Next episode</h2><button className="next-card" onClick={() => navigate(pathFor('watch', title.id, nextEpisode.id))}><img src={title.image} alt="" /><div><span>Episode {String(nextEpisode.number).padStart(2, '0')}</span><h3>{nextEpisode.title}</h3></div><ChevronRight size={16} /></button></section>}
  </main>;
}

function Footer() {
  return <footer className="footer"><span>AnimStreamX / late-night anime, hand-picked</span><span>© 2025 AX room / no noise, just stories</span></footer>;
}

export default App;