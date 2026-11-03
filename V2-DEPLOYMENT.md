# AnimStreamX v2 — Vercel deployment

The v2 project contains 9 titles and 103 playable video mappings. Its source code, API, optimized posters and Vercel configuration are ready to build together.

## Upgrade the existing Vercel project

1. Upload/push the complete updated project and choose its directory containing `package.json` as the Vercel Root Directory. Do not deploy only `dist/`: playback needs `api/` and `server/`.
2. In Vercel **Settings → Environment Variables**, replace `PLAYBACK_SOURCES_JSON` for **Production and Preview** with the updated JSON value from this local project's `.env.local`. Copy the JSON object only, without `PLAYBACK_SOURCES_JSON=` or the surrounding single quotes. The old v1 value has 16 entries; the updated value has 103.
3. Use **Node.js 24.x** and the **Vite** preset. The checked-in configuration supplies `npm ci`, `npm run build` and output directory `dist`.
4. Deploy after updating the variable. Leave optional `APP_ORIGIN` unset for automatically generated Preview URLs; set it only when intentionally restricting browser requests to one canonical origin.
5. After deployment, check `/movies/`, `/anime/`, Solo Leveling season 2, Jujutsu Kaisen season 3 and one of the new movies. Confirm the provider starts playback on the deployed domain.

The private source document and `.env.local` are excluded from Git, Vercel uploads and the distributable source ZIP. The source ZIP alone does not include the playback variable. It must be configured in Vercel separately.

## Local validation

```sh
npm ci
npm run check
npm run build
npm run preview
```

Open `http://127.0.0.1:5000`. Production builds reject missing artwork, duplicate IDs, incomplete/extra source mappings and unapproved player URLs. They also check for accidental exposure of source URLs or environment files in public assets. Automated API tests use dummy source values.

The build includes a separate compiled API check (`npm run verify:function`). It uses the root TypeScript settings, starts the emitted JavaScript in plain Node.js, and verifies all 103 playable selections with dummy sources. This catches function import and startup errors before deployment.

## Included changes

- 48 additional Jujutsu Kaisen episodes: S1 E12–24, S2 E1–23 and S3 E1–12.
- Chainsaw Man S1 E1–12 and Solo Leveling S1 E1–12 / S2 E1–13.
- Your Name and Avengers: Endgame Hindi movies.
- Five supplied posters, including separate Solo Leveling season artwork.
- Individually researched titles and original short descriptions for all 159 series episodes and five movies, with per-entry source notes in `docs/EPISODE-SOURCES.md`.
- Story descriptions visible on mobile and on pending episodes, with playback status shown separately.
- Category route normalization, keyboard navigation, catalog-driven genres, correct selected-season playback and clearer external-player status.
- Vite 6.4.5 security patch and package version 2.0.0.

The original 16 playback mappings remain intact. Unsupplied Demon Slayer episodes remain pending. Playback availability, subtitles and quality are controlled by the external provider; local source/API checks do not guarantee upstream uptime.
