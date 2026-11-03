# AnimStreamX v2

A cinematic React + TypeScript anime and movie catalog with a small Vercel playback API. Version 2 includes 9 titles and 103 configured playable entries. Video URLs stay in server environment configuration and are not shipped in the public catalog or JavaScript bundle.

## Version 2 catalog

- Jujutsu Kaisen: all 24 season-one, 23 season-two and 12 season-three episodes.
- Chainsaw Man: 12 season-one episodes, alongside the existing Reze Arc movie.
- Solo Leveling: 12 season-one and 13 season-two episodes, with separate season posters.
- Your Name and Avengers: Endgame: Hindi feature films with their supplied posters.
- The original movies and two available Demon Slayer episodes are preserved. Demon Slayer entries without supplied sources remain pending.

The release adds 87 playback sources to the original 16. Category URLs accept trailing slashes, the mobile menu supports keyboard entry and Escape, and genre filters follow the catalog. Vite is updated to the patched 6.4.5 release.

All 159 series episodes and all five movie entries now have short, individually researched story descriptions. Episode names use verified English titles. Summaries appear for available and pending episodes, including on mobile; playback status is displayed separately. Research links and the date checked are recorded in [docs/EPISODE-SOURCES.md](docs/EPISODE-SOURCES.md). The build rejects generic episode titles and missing story descriptions.

## Local development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:5000`. The development server is bound to this computer only. Vite runs the same playback handler locally as Vercel. This workspace's ignored `.env.local` contains all 103 v2 playback mappings, including the imported links from the supplied source document. Keep it private and restart Vite after changing it.

For a fresh checkout, copy `.env.example` to `.env.local`, then configure `PLAYBACK_SOURCES_JSON` before testing playback. Development mode can show the catalog without playback configuration. Production builds require a valid source for every available episode and reject missing, extra or invalid mappings.

```sh
npm run check     # TypeScript, routing, catalog and Node HTTP API tests
npm run build     # Compiled API smoke test, production build and artifact validation
npm run preview   # Local production preview with the playback API
```

`dist/` is generated output and is excluded from version control. Edit `src/` and `index.css`, then rebuild. The build checks unique catalog IDs, referenced artwork, exact playback coverage, approved provider URLs, and absence of direct player URLs, private environment files and source maps in public output. Private URL values are never included in validation errors.

The build also runs `npm run verify:function`: it compiles the API with the root TypeScript configuration and starts the emitted JavaScript in plain Node.js, checking every playable selection with dummy sources. Vercel compiles API functions separately from Vite and does not use TypeScript project references. Runtime imports in the API's dependency chain therefore use `.js` extensions, which TypeScript resolves to the matching source files during development.

## Deploy on Vercel

1. Import the repository into Vercel. Select the folder containing this `package.json` as the Root Directory (`.` when importing the AnimeStreamX repository itself).
2. Add or replace **PLAYBACK_SOURCES_JSON** in Project Settings → Environment Variables for **Production and Preview** with the updated v2 value. Copy only the JSON value from the local `.env.local`, without the variable name or surrounding single quotes. The v1 value contains only 16 mappings; v2 needs all 103. Do not use a `VITE_` prefix. Set the variable before building; the build deliberately fails if any playable source is missing.
3. Deploy. `vercel.json` selects Vite, runs `npm ci` and `npm run build`, serves `dist/`, and routes `/api/playback` to its Node function. Client-side routes have an HTML fallback, so direct title links and refreshes work.
4. Redeploy after changing an environment variable. Optionally set `APP_ORIGIN` to one exact canonical origin, such as `https://your-domain.example`. Leave it unset to support unique Vercel Preview URLs.

The private configuration is intentionally excluded from Git and Vercel file uploads. The deployment gets its values from Vercel environment variables. Use Node.js 24.x. No database is required. `npm run preview` is for local review, not the production server. Deploy the complete project, including `api/` and `server/`; uploading `dist/` alone cannot serve the playback API.

## Playback configuration

`PLAYBACK_SOURCES_JSON` is a JSON object mapping `title-id/episode-id` to the exact player URL. Only HTTPS URLs at `player.abyssplayer.com` and `iframe.mediadelivery.net` are accepted. The public `src/data.ts` catalog contains `available: true` for playable episodes and `false` for pending episodes.

When adding a video, update both the server environment mapping and the public availability flag. To add another video provider, update the server allowlist, the production `frame-src` Content Security Policy in `vercel.json`, and the API tests together.

The API accepts only `POST /api/playback` with `{ "titleId": "...", "episodeId": "..." }`. It validates catalog entries and availability, limits JSON requests to 2 KB, rejects foreign browser origins, and returns responses with `Cache-Control: no-store`. It never accepts a video URL from the caller or proxies arbitrary URLs. Missing configuration produces a controlled error without exposing source values.

### Protection boundaries

This is a public catalog, not an authenticated subscription service. Origin checks are browser request protections, not authentication; scripted clients can imitate those headers. The source is returned to a viewer after they press play and remains inspectable in browser network tools. Genuine access control requires signed/expiring playback URLs or domain/access controls supplied by the video provider. Public traffic rate limits should be configured with Vercel Firewall when deploying; there is no unreliable per-process rate limiter presented as protection here.

Production pages block the context menu outside editable fields and common inspect/view-source shortcuts as a best-effort deterrent. Browser menus, pre-opened DevTools, extensions, and cross-origin iframe menus remain outside the page’s control. Development mode keeps these shortcuts available for maintenance. No debugger loops, keyboard traps, or attempts to detect users’ DevTools are used.

The original URLs were previously present in source control. Removing them from the current client does not erase Git history or invalidate links already shared. Rotate/restrict them with the provider if previously published URLs need to stop working.

## Interface

- Responsive Home, Explore, Movies, Series, Collections and individual collection pages.
- Search, genre filtering, sorting, grid/list layouts, and a “Surprise me” discovery action.
- Title details, season selection, available-only filtering, and clear pending states.
- On-demand player lookup, connection/error feedback, retry controls, cinema mode, and available episode navigation.
- Persistent watchlist and recently opened titles, with cross-tab updates and validation.
- Progressive scroll reveals, staggered entrances, refined interactions, a scroll progress indicator, and back-to-top. Reduced-motion preferences are respected; content remains visible if animation APIs are unavailable.
- Help, privacy/storage explanations, and useful not-found pages.

Watchlists and recently opened episodes stay in this browser. Playback progress, subtitles, and quality remain under the external video provider’s control. Legacy catalog query links and the older Jujutsu Kaisen season-one title URL remain supported.

## Source layout

- `src/data.ts`: public catalog metadata and availability only.
- `src/metadata/`: researched episode titles and original short descriptions, organized by series.
- `src/editorial.ts`: spotlight/collection/FAQ copy and catalog helpers.
- `src/pages.tsx`, `src/components.tsx`: pages and shared UI.
- `src/playback.ts`: on-demand requests with cancellation, timeout, and error handling.
- `src/library.tsx`, `src/navigation.tsx`: browser storage and navigation.
- `src/motion.tsx`, `src/content-guard.ts`: motion enhancement and production-only UI deterrents.
- `server/playback.ts`, `api/playback.ts`: shared request handler and Vercel entry point.
- `tests/playback.test.ts`: Node HTTP request tests using dummy video URLs.
- `tests/catalog.test.ts`: catalog and production configuration validation tests using dummy sources.
- `tests/episode-metadata.test.ts`: checks synopsis quality and source coverage for every catalog entry, including pending episodes.
- `docs/EPISODE-SOURCES.md`, `docs/episode-sources.json`: episode and movie research provenance.
- `scripts/catalog-validation.ts`, `scripts/verify-build.mjs`: production catalog, playback coverage and public artifact checks.
- `scripts/verify-function.mjs`: emitted JavaScript startup and HTTP checks for the Vercel API, without a TypeScript loader.
- `public/artwork/`: optimized images used by the site.
- `index.css`: responsive styling and reduced-motion rules.

Unused original image uploads were archived outside this project during cleanup. Replit configuration and redundant build assets are not required by the Vercel deployment.
