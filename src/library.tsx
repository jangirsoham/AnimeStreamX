import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getEpisodes, isPlayable, titles } from "./data";

export type HistoryEntry = {
  titleId: string;
  episodeId: string;
  openedAt: number;
};
type Library = {
  saved: string[];
  history: HistoryEntry[];
  toggleSaved: (id: string) => void;
  remember: (titleId: string, episodeId: string) => void;
  removeHistory: (titleId: string) => void;
  notice: string;
};
const LibraryContext = createContext<Library | null>(null);
const SAVED_KEY = "animstreamx.watchlist";
const HISTORY_KEY = "animstreamx.history";
const HISTORY_LIMIT = 8;
const validTitle = (id: unknown): id is string =>
  typeof id === "string" && titles.some((title) => title.id === id);
function parseSaved(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter(validTitle))] : [];
  } catch {
    return [];
  }
}
function parseHistory(raw: string | null): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
      .filter((entry): entry is HistoryEntry => {
        if (
          !entry ||
          typeof entry !== "object" ||
          !validTitle(entry.titleId) ||
          typeof entry.episodeId !== "string" ||
          typeof entry.openedAt !== "number" ||
          !Number.isFinite(entry.openedAt) ||
          entry.openedAt <= 0
        )
          return false;
        const title = titles.find((item) => item.id === entry.titleId)!;
        return getEpisodes(title).some(
          (episode) => episode.id === entry.episodeId && isPlayable(episode),
        );
      })
      .sort((a, b) => b.openedAt - a.openedAt)
      .filter((entry) => {
        if (seen.has(entry.titleId)) return false;
        seen.add(entry.titleId);
        return true;
      })
      .slice(0, HISTORY_LIMIT)
      .map(({ titleId, episodeId, openedAt }) => ({
        titleId,
        episodeId,
        openedAt,
      }));
  } catch {
    return [];
  }
}
function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persist(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(() => parseSaved(readStorage(SAVED_KEY)));
  const [history, setHistory] = useState(() =>
    parseHistory(readStorage(HISTORY_KEY)),
  );
  const savedRef = useRef(saved);
  const historyRef = useRef(history);
  const [notice, setNotice] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timeout.current), []);
  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      try {
        if (event.storageArea !== localStorage) return;
      } catch {
        return;
      }
      if (event.key === SAVED_KEY || event.key === null) {
        const next = parseSaved(event.key === null ? null : event.newValue);
        savedRef.current = next;
        setSaved(next);
      }
      if (event.key === HISTORY_KEY || event.key === null) {
        const next = parseHistory(event.key === null ? null : event.newValue);
        historyRef.current = next;
        setHistory(next);
      }
    };
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);
  function announce(text: string) {
    clearTimeout(timeout.current);
    setNotice(text);
    timeout.current = setTimeout(() => setNotice(""), 4000);
  }
  function toggleSaved(id: string) {
    if (!validTitle(id)) return;
    const exists = savedRef.current.includes(id);
    const next = exists
      ? savedRef.current.filter((item) => item !== id)
      : [...savedRef.current, id];
    savedRef.current = next;
    setSaved(next);
    const stored = persist(SAVED_KEY, next);
    announce(
      stored
        ? exists
          ? "Removed from your watchlist"
          : "Added to your watchlist"
        : "Updated for this visit. Browser storage is unavailable.",
    );
  }
  function remember(titleId: string, episodeId: string) {
    const title = titles.find((item) => item.id === titleId);
    if (
      !title ||
      !getEpisodes(title).some(
        (episode) => episode.id === episodeId && isPlayable(episode),
      )
    )
      return;
    const next = [
      { titleId, episodeId, openedAt: Date.now() },
      ...historyRef.current.filter((entry) => entry.titleId !== titleId),
    ].slice(0, HISTORY_LIMIT);
    historyRef.current = next;
    setHistory(next);
    if (!persist(HISTORY_KEY, next))
      announce(
        "Recently opened is available for this visit. Browser storage is unavailable.",
      );
  }
  function removeHistory(titleId: string) {
    const next = historyRef.current.filter(
      (entry) => entry.titleId !== titleId,
    );
    historyRef.current = next;
    setHistory(next);
    const stored = persist(HISTORY_KEY, next);
    announce(
      stored
        ? "Removed from recently opened"
        : "Removed for this visit. Browser storage is unavailable.",
    );
  }
  return (
    <LibraryContext.Provider
      value={{
        saved,
        history,
        toggleSaved,
        remember,
        removeHistory,
        notice,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("LibraryProvider is required");
  return context;
}
