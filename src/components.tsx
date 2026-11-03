import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Menu,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { type Title } from "./data";
import { availableCount, formatType, shortTitle, titlePath } from "./editorial";
import { useLibrary } from "./library";
import { Link, useNavigation } from "./navigation";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="AnimStreamX home">
      <svg
        className="brand-symbol"
        width="30"
        height="31"
        viewBox="0 0 30 31"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 25 13 5h6L9 25H3Zm12 0L25 5h4L19 25h-4Z"
          fill="currentColor"
        />
      </svg>
      <span>
        animstream<span className="brand-x">x</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { url, go } = useNavigation();
  const { saved } = useLibrary();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => setOpen(false), [url]);
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        event.preventDefault();
        go("/catalog?search=1");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [go, open]);
  const navItems = [
    ["/", "Home"],
    ["/catalog", "Explore"],
    ["/movies", "Movies"],
    ["/anime", "Series"],
    ["/collections", "Collections"],
  ];
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav
            ref={menu}
            className={`main-nav ${open ? "is-open" : ""}`}
            id="main-navigation"
            aria-label="Main navigation"
          >
            {navItems.map(([path, label]) => (
              <Link
                key={path}
                href={path}
                className={`nav-link ${url.pathname === path || (path === "/collections" && url.pathname.startsWith("/collection/")) ? "active" : ""}`}
                aria-current={url.pathname === path ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            <Link href="/help" className="nav-link mobile-help">
              Help & information
            </Link>
          </nav>
          <div className="header-actions">
            <Link
              href="/catalog?search=1"
              className="header-search"
              aria-label="Search titles"
            >
              <Search size={18} />
              <span>Search titles</span>
              <kbd>/</kbd>
            </Link>
            <span className="header-divider" />
            <Link
              href="/watchlist"
              className={`header-library ${url.pathname === "/watchlist" ? "active" : ""}`}
              aria-label={`My watchlist${saved.length ? `, ${saved.length} saved titles` : ""}`}
            >
              <Bookmark size={18} />
              <span>My list</span>
              {saved.length > 0 && <b>{saved.length}</b>}
            </Link>
            <button
              ref={menuButton}
              className="icon-button menu-toggle"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="main-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export function SaveButton({
  title,
  iconOnly = false,
  className = "",
}: {
  title: Title;
  iconOnly?: boolean;
  className?: string;
}) {
  const { saved, toggleSaved } = useLibrary();
  const selected = saved.includes(title.id);
  return (
    <button
      className={`${iconOnly ? "card-save" : "button button-secondary"} ${selected ? "is-saved" : ""} ${className}`}
      onClick={() => toggleSaved(title.id)}
      aria-label={`${selected ? "Remove" : "Add"} ${shortTitle(title)} ${selected ? "from" : "to"} watchlist`}
      aria-pressed={selected}
      title={selected ? "Remove from watchlist" : "Add to watchlist"}
    >
      {selected ? (
        <Check size={iconOnly ? 18 : 17} />
      ) : (
        <Plus size={iconOnly ? 18 : 20} />
      )}
      {!iconOnly && <span>{selected ? "In my list" : "Add to my list"}</span>}
    </button>
  );
}

export function TitleCard({
  title,
  index,
  wide = false,
}: {
  title: Title;
  index?: number;
  wide?: boolean;
}) {
  return (
    <article className={`title-card ${wide ? "title-card-wide" : ""}`}>
      <div className="card-artwork">
        <Link
          href={titlePath(title)}
          className="poster-link"
          aria-label={`View ${shortTitle(title)}`}
        >
          <img
            src={title.image}
            alt={`${shortTitle(title)} poster`}
            loading="lazy"
            width="400"
            height="600"
          />
          <span className="poster-shade" />
          <span className="poster-open">
            <ArrowUpRight size={24} />
          </span>
        </Link>
        <span className="card-type">{formatType(title)}</span>
        <SaveButton title={title} iconOnly />
        {index !== undefined && (
          <span className="card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <span className="card-availability">
          <span />
          {title.type === "Anime"
            ? `${availableCount(title)} episodes available`
            : "Ready to watch"}
        </span>
      </div>
      <div className="card-copy">
        <div className="card-meta">
          <span>{title.year}</span>
          <span className="tiny-dot" />
          <span>{title.genre}</span>
          {title.rating !== "—" && (
            <span className="card-rating">
              <Star size={11} fill="currentColor" />
              {title.rating}
            </span>
          )}
        </div>
        <h3>
          <Link href={titlePath(title)}>{shortTitle(title)}</Link>
        </h3>
        {wide && <p>{title.description}</p>}
      </div>
    </article>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action = "View all",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {action}
          <ArrowRight size={17} />
        </Link>
      )}
      {children}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">
          <span className="accent-line" />
          {eyebrow}
        </p>
        <h1>
          {title}
          <span className="accent-dot">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((item, index) => (
        <span key={index}>
          <ChevronRight size={12} />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p>A world beyond the ordinary.</p>
        </div>
        <div className="footer-nav">
          <div>
            <span>DISCOVER</span>
            <Link href="/movies">Movies</Link>
            <Link href="/anime">Series</Link>
            <Link href="/collections">Collections</Link>
          </div>
          <div>
            <span>YOUR SPACE</span>
            <Link href="/watchlist">My watchlist</Link>
            <Link href="/watchlist?tab=history">Recently opened</Link>
            <Link href="/help">Help & information</Link>
          </div>
          <div className="footer-message">
            <span>STAY CURIOUS</span>
            <p>
              New worlds.
              <br />
              Unforgettable stories.
            </p>
            <Link href="/catalog" className="text-link">
              Find your next watch
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AnimStreamX</span>
        <span>
          Made for the love of anime.<span className="footer-dot">✳</span>
        </span>
        <Link href="/help#privacy">Privacy & storage</Link>
      </div>
    </footer>
  );
}
