import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getEpisodes, titles } from "../src/data.ts";

type SourceRecord = {
  titleId: string;
  episodeId: string;
  episodeTitle: string;
  synopsisSource: string;
  accessed: string;
};

test("every movie and episode, including pending entries, has a concise distinct synopsis and source", () => {
  const sources = JSON.parse(
    readFileSync(new URL("../docs/episode-sources.json", import.meta.url), "utf8"),
  ) as SourceRecord[];
  const byKey = new Map(sources.map((source) => [`${source.titleId}/${source.episodeId}`, source]));
  assert.equal(byKey.size, sources.length, "Duplicate source records");
  const expectedKeys = new Set<string>();
  for (const title of titles) {
    const descriptions = new Set<string>();
    for (const episode of getEpisodes(title)) {
      const key = `${title.id}/${episode.id}`;
      expectedKeys.add(key);
      const words = episode.description.trim().split(/\s+/);
      assert.ok(words.length >= 12 && words.length <= 45, `Synopsis should be short and meaningful: ${key}`);
      assert.ok(!descriptions.has(episode.description), `Repeated synopsis: ${key}`);
      descriptions.add(episode.description);
      const source = byKey.get(key);
      assert.ok(source, `Missing source: ${key}`);
      assert.equal(source.episodeTitle, episode.title, `Source title differs: ${key}`);
      assert.equal(new URL(source.synopsisSource).protocol, "https:");
      assert.match(source.accessed, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
  assert.deepEqual(new Set(byKey.keys()), expectedKeys, "Source list must match the whole catalog");
});
