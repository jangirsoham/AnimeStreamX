import { getEpisodes, type Title } from "../src/data.ts";

const providerHosts = new Set([
  "player.abyssplayer.com",
  "iframe.mediadelivery.net",
]);

function isIdentifier(value: string): boolean {
  return value.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export type CatalogValidation = {
  issues: string[];
  titleCount: number;
  episodeCount: number;
  playableKeys: string[];
};

/** Checks public metadata without reading environment variables or player URLs. */
export function validateCatalog(
  catalog: readonly Title[],
  artworkExists: (publicPath: string) => boolean,
): CatalogValidation {
  const issues: string[] = [];
  const titleIds = new Set<string>();
  const playableKeys: string[] = [];
  let episodeCount = 0;
  const checkArtwork = (
    image: string,
    id: string,
    kind: "title" | "season",
  ) => {
    const imageSegments = image.split("/");
    if (
      !image.startsWith("/") ||
      image.startsWith("//") ||
      /[\\?#]/.test(image) ||
      imageSegments.some((segment) => segment === "." || segment === "..")
    ) {
      issues.push(`Artwork must use a local public path: ${id}.`);
    } else if (!artworkExists(image)) {
      issues.push(`Missing artwork for ${kind}: ${id}.`);
    }
  };

  for (const title of catalog) {
    if (!isIdentifier(title.id)) issues.push("A title has an invalid ID.");
    if (titleIds.has(title.id)) issues.push(`Duplicate title ID: ${title.id}.`);
    titleIds.add(title.id);
    checkArtwork(title.image, title.id, "title");

    if (title.episodes && title.seasons) {
      issues.push(`Title defines both episodes and seasons: ${title.id}.`);
    }
    const seasonIds = new Set<string>();
    for (const season of title.seasons ?? []) {
      if (!isIdentifier(season.id)) {
        issues.push(`Invalid season ID in title: ${title.id}.`);
      }
      if (seasonIds.has(season.id)) {
        issues.push(`Duplicate season ID: ${title.id}/${season.id}.`);
      }
      seasonIds.add(season.id);
      if (season.image !== undefined) {
        checkArtwork(season.image, `${title.id}/${season.id}`, "season");
      }
      for (const episode of season.episodes) {
        if (episode.seasonId !== season.id) {
          issues.push(`Episode has the wrong season: ${title.id}/${episode.id}.`);
        }
      }
    }

    const episodes = getEpisodes(title);
    if (!episodes.length) issues.push(`Title has no episodes: ${title.id}.`);
    const episodeIds = new Set<string>();
    for (const episode of episodes) {
      const key = `${title.id}/${episode.id}`;
      if (!isIdentifier(episode.id)) {
        issues.push(`Invalid episode ID in title: ${title.id}.`);
      }
      if (episodeIds.has(episode.id)) {
        issues.push(`Duplicate episode ID: ${key}.`);
      }
      episodeIds.add(episode.id);
      if (typeof episode.available !== "boolean") {
        issues.push(`Episode availability must be explicit: ${key}.`);
      }
      if (!episode.title.trim() || /^episode\s*\d+$/i.test(episode.title.trim())) {
        issues.push(`Episode needs an editorial title: ${key}.`);
      }
      const description = episode.description.trim();
      if (
        description.length < 40 ||
        /^(?:ready to (?:watch|play)|this episode is not available yet|feature film)(?:[.\s·]|$)/i.test(description)
      ) {
        issues.push(`Episode needs a story description: ${key}.`);
      }
      if (episode.available === true) playableKeys.push(key);
    }
    episodeCount += episodes.length;
  }

  return { issues, titleCount: catalog.length, episodeCount, playableKeys };
}

function summarizeKeys(keys: string[]): string {
  const visible = keys.slice(0, 8).join(", ");
  return keys.length > 8 ? `${visible} (+${keys.length - 8} more)` : visible;
}

function isProviderSource(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value)) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      providerHosts.has(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  } catch {
    return false;
  }
}

/** Private values are returned for in-memory artifact scanning, never diagnostics. */
export function validatePlaybackSources(
  playableKeys: readonly string[],
  rawConfiguration: string | undefined,
): { issues: string[]; sources: string[] } {
  const issues: string[] = [];
  const sources: string[] = [];
  const expected = new Set(playableKeys);
  if (!rawConfiguration) {
    if (expected.size) {
      issues.push(
        `Missing PLAYBACK_SOURCES_JSON: configure sources for ${expected.size} playable episodes.`,
      );
    }
    return { issues, sources };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawConfiguration);
  } catch {
    issues.push(
      "PLAYBACK_SOURCES_JSON contains invalid JSON; its value was not logged.",
    );
    return { issues, sources };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    issues.push(
      "PLAYBACK_SOURCES_JSON must be a JSON object; its value was not logged.",
    );
    return { issues, sources };
  }

  const configured = new Set<string>();
  const extras: string[] = [];
  for (const [index, [key, value]] of Object.entries(parsed).entries()) {
    const identifiers = key.split("/");
    if (identifiers.length !== 2 || !identifiers.every(isIdentifier)) {
      issues.push(
        `Invalid source mapping key at entry ${index + 1}; its value was not logged.`,
      );
      continue;
    }
    configured.add(key);
    if (!expected.has(key)) extras.push(key);
    if (!isProviderSource(value)) {
      issues.push(
        `Invalid or unapproved player URL for ${key}; its value was not logged.`,
      );
    } else {
      sources.push(value);
    }
  }
  const missing = [...expected].filter((key) => !configured.has(key));
  if (missing.length) {
    issues.push(
      `Missing sources for ${missing.length} playable episodes: ${summarizeKeys(missing)}.`,
    );
  }
  if (extras.length) {
    issues.push(
      `Configured sources outside the playable catalog (${extras.length}): ${summarizeKeys(extras)}.`,
    );
  }
  return { issues, sources };
}
