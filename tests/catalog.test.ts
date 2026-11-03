import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { titles, type Title } from "../src/data.ts";
import {
  validateCatalog,
  validatePlaybackSources,
} from "../scripts/catalog-validation.ts";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const dummySource = "https://player.abyssplayer.com/catalog-test";
const fixture: Title = {
  id: "fixture-show",
  title: "Fixture Show",
  type: "Anime",
  year: "2026",
  rating: "—",
  genre: "Action",
  runtime: "2 episodes",
  description: "Catalog validation fixture.",
  image: "/artwork/fixture.webp",
  episodes: [
    {
      id: "episode-1",
      number: 1,
      title: "Available episode",
      description: "A young hunter follows a trail into the mountains and discovers that his first assignment is more dangerous than expected.",
      duration: "23m",
      available: true,
    },
    {
      id: "episode-2",
      number: 2,
      title: "Pending episode",
      description: "The team searches an abandoned station while their missing partner tries to find a way back through the tunnels.",
      duration: "23m",
      available: false,
    },
  ],
};
const playableKey = "fixture-show/episode-1";

test("editorial metadata is required for both available and pending episodes", () => {
  for (const available of [true, false]) {
    const title = structuredClone(fixture);
    title.episodes![0] = {
      ...title.episodes![0], available, title: "Episode 01", description: "Ready to watch.",
    };
    const issues = validateCatalog([title], () => true).issues;
    assert.ok(issues.includes("Episode needs an editorial title: fixture-show/episode-1."));
    assert.ok(issues.includes("Episode needs a story description: fixture-show/episode-1."));
  }
});

test("the public catalog has unambiguous IDs and existing artwork without requiring playback secrets", () => {
  const result = validateCatalog(titles, (publicPath) => {
    try {
      return statSync(join(publicDirectory, publicPath)).isFile();
    } catch {
      return false;
    }
  });
  assert.deepEqual(result.issues, []);
  assert.ok(result.titleCount > 0);
  assert.ok(result.episodeCount >= result.playableKeys.length);
  assert.equal(new Set(result.playableKeys).size, result.playableKeys.length);
});

test("catalog validation catches duplicate title, season, and episode IDs", () => {
  const duplicateTitles = validateCatalog([fixture, fixture], () => true);
  assert.ok(duplicateTitles.issues.includes("Duplicate title ID: fixture-show."));

  const title = structuredClone(fixture);
  const episode = { ...title.episodes![0], seasonId: "season-1" };
  delete title.episodes;
  title.seasons = [
    { id: "season-1", label: "Season 1", episodes: [episode] },
    { id: "season-1", label: "Season 1 again", episodes: [{ ...episode }] },
  ];
  const result = validateCatalog([title], () => true);
  assert.ok(
    result.issues.includes("Duplicate season ID: fixture-show/season-1."),
  );
  assert.ok(
    result.issues.includes("Duplicate episode ID: fixture-show/episode-1."),
  );
});

test("catalog validation rejects missing artwork and paths outside public assets", () => {
  assert.deepEqual(validateCatalog([fixture], () => false).issues, [
    "Missing artwork for title: fixture-show.",
  ]);
  for (const image of [
    "https://example.com/poster.webp",
    "/../private.webp",
    "//example.com/poster.webp",
  ]) {
    const result = validateCatalog([{ ...fixture, image }], () => {
      assert.fail("Unsafe image paths must not reach the filesystem lookup.");
    });
    assert.deepEqual(result.issues, [
      "Artwork must use a local public path: fixture-show.",
    ]);
  }
});

test("optional season artwork must exist and use a safe local public path", () => {
  const title = structuredClone(fixture);
  const episodes = title.episodes!.map((episode) => ({
    ...episode,
    seasonId: "season-1",
  }));
  delete title.episodes;
  const season = { id: "season-1", label: "Season 1", episodes };
  title.seasons = [season];
  assert.deepEqual(validateCatalog([title], () => true).issues, []);

  title.seasons = [{ ...season, image: "/artwork/missing-season.webp" }];
  const missing = validateCatalog(
    [title],
    (publicPath) => publicPath === fixture.image,
  );
  assert.deepEqual(missing.issues, [
    "Missing artwork for season: fixture-show/season-1.",
  ]);

  for (const image of [
    "https://example.com/season.webp",
    "/../private.webp",
    "//example.com/season.webp",
    "/artwork/season.webp?version=1",
  ]) {
    title.seasons = [{ ...season, image }];
    const unsafe = validateCatalog([title], (publicPath) => {
      assert.equal(publicPath, fixture.image);
      return true;
    });
    assert.deepEqual(unsafe.issues, [
      "Artwork must use a local public path: fixture-show/season-1.",
    ]);
  }
});

test("only playable episodes require a source, and accepted provider parameters are preserved", () => {
  const catalog = validateCatalog([fixture], () => true);
  assert.deepEqual(catalog.playableKeys, [playableKey]);
  for (const source of [
    dummySource,
    "https://iframe.mediadelivery.net/embed/test/library?autoplay=true&muted=false",
  ]) {
    const result = validatePlaybackSources(
      catalog.playableKeys,
      JSON.stringify({ [playableKey]: source }),
    );
    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.sources, [source]);
  }
});

test("production validation fails for absent, incomplete, unknown, and pending source mappings", () => {
  const missingEnvironment = validatePlaybackSources([playableKey], undefined);
  assert.ok(
    missingEnvironment.issues.some((issue) =>
      issue.includes("Missing PLAYBACK_SOURCES_JSON"),
    ),
  );
  const incomplete = validatePlaybackSources([playableKey], "{}");
  assert.ok(
    incomplete.issues.some((issue) =>
      issue.includes(`Missing sources for 1 playable episodes: ${playableKey}`),
    ),
  );
  for (const extra of ["fixture-show/episode-2", "unknown-show/movie"]) {
    const result = validatePlaybackSources(
      [playableKey],
      JSON.stringify({ [playableKey]: dummySource, [extra]: dummySource }),
    );
    assert.ok(
      result.issues.some((issue) =>
        issue.includes(`outside the playable catalog (1): ${extra}`),
      ),
    );
  }
});

test("malformed configurations and unsafe URLs fail without including private values in diagnostics", () => {
  for (const configuration of [
    "{private-config-sentinel",
    "null",
    "[]",
    '"private-config-sentinel"',
  ]) {
    const result = validatePlaybackSources([playableKey], configuration);
    assert.ok(result.issues.length > 0);
    assert.ok(!result.issues.join(" ").includes("private-config-sentinel"));
  }
  const invalidSources: unknown[] = [
    "https://example.com/private-source-sentinel",
    "http://player.abyssplayer.com/private-source-sentinel",
    "https://player.abyssplayer.com.example.com/private-source-sentinel",
    "https://user:private-source-sentinel@player.abyssplayer.com/video",
    "https://player.abyssplayer.com:444/private-source-sentinel",
    "https://player.abyssplayer.com/video#private-source-sentinel",
    "https://player.abyssplayer.com/private-source-sentinel\n",
    "https://player.abyssplayer.com/" + "x".repeat(2048),
    { privateValue: "private-source-sentinel" },
  ];
  for (const value of invalidSources) {
    const result = validatePlaybackSources(
      [playableKey],
      JSON.stringify({ [playableKey]: value }),
    );
    assert.ok(
      result.issues.some((issue) =>
        issue.includes("Invalid or unapproved player URL"),
      ),
    );
    assert.ok(!result.issues.join(" ").includes("private-source-sentinel"));
    assert.deepEqual(result.sources, []);
  }
  const invalidKey = validatePlaybackSources(
    [playableKey],
    JSON.stringify({ "https://example.com/private-key-sentinel": dummySource }),
  );
  assert.ok(
    invalidKey.issues.some((issue) => issue.includes("Invalid source mapping key")),
  );
  assert.ok(!invalidKey.issues.join(" ").includes("private-key-sentinel"));
});
