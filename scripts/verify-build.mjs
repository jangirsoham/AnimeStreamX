import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnv } from "vite";
import { titles } from "../src/data.ts";
import { validateCatalog, validatePlaybackSources } from "./catalog-validation.ts";

const output = join(process.cwd(), "dist");
const catalog = validateCatalog(titles, (publicPath) => {
  try {
    return statSync(join(output, publicPath)).isFile();
  } catch {
    return false;
  }
});
const environment = loadEnv("production", process.cwd(), "PLAYBACK_");
const playback = validatePlaybackSources(
  catalog.playableKeys,
  environment.PLAYBACK_SOURCES_JSON,
);
const issues = [...catalog.issues, ...playback.issues];
if (issues.length) {
  throw new Error(`Production catalog validation failed:\n- ${issues.join("\n- ")}`);
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else files.push(path);
  }
  return files;
}

const files = await filesIn(output);
assert(
  files.some((path) => path === join(output, "index.html")),
  "Missing production entry point",
);
assert(
  !files.some((path) => path.endsWith(".map")),
  "Production source maps must remain disabled",
);
assert(
  !files.some((path) => /(?:^|[\\/])\.env(?:[./\\]|$)/.test(path)),
  "Private environment files must not be published",
);

for (const path of files.filter((file) =>
  /\.(?:[cm]?js|css|html|json|txt|svg|xml|webmanifest)$/i.test(file),
)) {
  const content = await readFile(path, "utf8");
  assert(
    !content.includes("PLAYBACK_SOURCES_JSON"),
    "Server configuration was bundled into the public site",
  );
  assert(
    !/https?:\/\/(?:player\.abyssplayer\.com|iframe\.mediadelivery\.net)\//i.test(
      content,
    ),
    "A direct player URL was bundled into the public site",
  );
  assert(
    !playback.sources.some(
      (source) =>
        content.includes(source) ||
        content.includes(source.replaceAll("/", "\\/")),
    ),
    "A configured player URL was bundled into the public site",
  );
}

console.log(
  `Production checks passed: ${catalog.titleCount} titles, ${catalog.playableKeys.length} configured playable episodes, artwork present; no player URLs, private environment files, or source maps in public output.`,
);
